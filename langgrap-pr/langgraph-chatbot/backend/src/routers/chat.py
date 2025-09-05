# src/routers/chat.py
import json
import asyncio
import uuid
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from src.models.schemas import ChatRequest
from src.db.mongo import sessions_collection
from src.services.generate_title import generate_session_title
from src.services.history import (
    build_context_with_summary,
    consolidate_with_summary_pair,
)
from src.graph.chatbot_graph import ChatbotGraph

# New imports for final LLM synthesis streaming
from src.llm.lllm_groq import LLMGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

router = APIRouter()

print("[startup] Importing Chat router and building graph...")

# Build your LangGraph graph once per process
chatbot_state = ChatbotGraph()
chatbot_graph = chatbot_state.build_graph()
print("[startup] Chatbot graph built successfully.")


def _default_for_json(o):
    """
    Fallback converter for json.dumps. Handle:
      - pydantic BaseModel -> dict()
      - objects with .dict() -> .dict()
      - objects with __dict__ -> __dict__
      - types/classes/metaclasses -> str()
      - anything else -> str()
    """
    try:
        import pydantic
        # If it's a Pydantic model instance
        try:
            if isinstance(o, pydantic.BaseModel):
                return o.dict()
        except Exception:
            # Some pydantic internals may be non-instantiable - ignore
            pass

        # Detect pydantic ModelMetaclass (the metaclass used to construct models)
        ModelMeta = getattr(pydantic._internal._model_construction, "ModelMetaclass", None) #type: ignore
        if ModelMeta is not None:
            try:
                if isinstance(o, ModelMeta) or (isinstance(o, type) and issubclass(o, ModelMeta)):
                    return str(o)
            except Exception:
                # safe fallback
                pass
    except Exception:
        # pydantic may not be present or introspection failed
        pass

    # Generic conversions
    try:
        if hasattr(o, "dict") and callable(getattr(o, "dict")):
            return o.dict()
    except Exception:
        pass

    try:
        if hasattr(o, "__dict__"):
            return vars(o)
    except Exception:
        pass

    # Types / classes / metaclasses: stringify them
    try:
        if isinstance(o, type):
            return str(o)
    except Exception:
        pass

    return str(o)


def safe_json_dumps(obj):
    """
    Robust JSON dumper that will not raise when given Pydantic models or other
    exotic objects. Uses _default_for_json as the default function.
    """
    try:
        return json.dumps(obj, default=_default_for_json, ensure_ascii=False)
    except Exception:
        # As a last fallback, coerce to string
        try:
            return json.dumps(str(obj), ensure_ascii=False)
        except Exception:
            return json.dumps({"error": "unserializable object"}, ensure_ascii=False)


def safe_event_summary(event) -> dict:
    """
    Return a tiny, safe summary of the event without invoking any potentially
    dangerous object protocols. Only use getattr/hasattr inside try/except.
    """
    summary = {"event": None, "name": None, "data_keys": None}
    try:
        # prefer attribute access (some event objects are simple objects)
        try:
            v = getattr(event, "event")
            summary["event"] = v if isinstance(v, (str, int, type(None))) else str(v) #type: ignore
        except Exception:
            try:
                summary["event"] = event.get("event") if isinstance(event, dict) else None
            except Exception:
                summary["event"] = None
    except Exception:
        summary["event"] = None

    try:
        try:
            n = getattr(event, "name")
            summary["name"] = n if isinstance(n, (str, int, type(None))) else str(n) #type: ignore
        except Exception:
            try:
                summary["name"] = event.get("name") if isinstance(event, dict) else None
            except Exception:
                summary["name"] = None
    except Exception:
        summary["name"] = None

    # data keys: don't inspect deeply
    try:
        if isinstance(event, dict):
            d = event.get("data", {}) or {}
            if isinstance(d, dict):
                summary["data_keys"] = list(d.keys()) #type: ignore
            else:
                summary["data_keys"] = "<non-dict>" #type: ignore
        else:
            # try attribute without calling property that might compute
            d = getattr(event, "data", None)
            if isinstance(d, dict):
                summary["data_keys"] = list(d.keys()) #type: ignore
            else:
                summary["data_keys"] = "<non-dict>" #type: ignore
    except Exception:
        summary["data_keys"] = "<uninspectable>" #type: ignore

    return summary


@router.get("/")
async def health():
    print("[health] / called")
    return {"message": "Chatbot FastAPI is running with MongoDB!"}


@router.post("/chat")
async def chat_with_bot(request: ChatRequest):
    print("[chat_with_bot] Entered /chat endpoint with request:", request)
    thread_id = request.thread_id or str(uuid.uuid4())
    print(f"[chat_with_bot] Using thread_id: {thread_id}")

    # Ensure session exists
    print("[chat_with_bot] Checking session in MongoDB...")
    session = await sessions_collection.find_one({"thread_id": thread_id})
    print("[chat_with_bot] DB session result:", session)
    if not session:
        print("[chat_with_bot] Session not found, creating new session.")
        await sessions_collection.insert_one({
            "thread_id": thread_id,
            "title": "New Chat",
            "messages": []
        })
        session = {"messages": []}
    else:
        print("[chat_with_bot] Session exists.")

    # 1) Condense older history into a summary pair + keep last 4 turns
    print("[chat_with_bot] Consolidating history with summary pair if needed...")
    await consolidate_with_summary_pair(thread_id, keep_turns=4, threshold_turns=10)
    print("[chat_with_bot] Consolidation complete.")

    # 2) Reload session after potential rewrite
    session = await sessions_collection.find_one({"thread_id": thread_id}) or {"messages": []}
    print("[chat_with_bot] Reloaded session:", session)

    # 3) Build context: includes summary pair (if present) + tail + new user message
    print("[chat_with_bot] Building context with summary...")
    ctx_msgs, summary_present = await build_context_with_summary(
        session_messages=session.get("messages", []),
        new_user_msg=request.message
    )
    print("[chat_with_bot] Context built. Summary present:", summary_present)
    print("[chat_with_bot] Context messages (len):", len(ctx_msgs))

    # 4) Persist the new human message (raw; future consolidations will prune)
    print("[chat_with_bot] Persisting new human message to DB...")
    await sessions_collection.update_one(
        {"thread_id": thread_id},
        {"$push": {"messages": {"role": "human", "content": request.message}}}
    )
    print("[chat_with_bot] Human message persisted.")

    # 5) Invoke the graph with the packed context
    print("[chat_with_bot] Invoking chatbot_graph.invoke(...)")
    try:
        response = chatbot_graph.invoke(
            {"messages": ctx_msgs},
            {"configurable": {"thread_id": thread_id}}
        )
        print("[chat_with_bot] Graph invoke returned.")
    except Exception as e:
        print("[chat_with_bot][ERROR] Graph invocation failed:", str(e))
        raise

    bot_message = response["messages"][-1].content if response.get("messages") else "No response from bot"
    print("[chat_with_bot] Bot message obtained:", bot_message)

    # 6) Save AI response
    print("[chat_with_bot] Saving AI response to DB...")
    await sessions_collection.update_one(
        {"thread_id": thread_id},
        {"$push": {"messages": {"role": "ai", "content": bot_message}}}
    )
    print("[chat_with_bot] AI response saved.")

    # 7) Generate/update session title (only if still "New Chat")
    print("[chat_with_bot] Generating session title if needed...")
    await generate_session_title(thread_id)
    print("[chat_with_bot] generate_session_title finished.")

    print("[chat_with_bot] Returning response to client.")
    return {"response": bot_message, "thread_id": thread_id}


@router.get("/stream-chat")
async def stream_chat(
    request: Request,
    message: str = Query(...),
    thread_id: str = Query(...),
):
    print("[stream_chat] Entered /stream-chat endpoint", {"message": message, "thread_id": thread_id})
    if not thread_id:
        print("[stream_chat][ERROR] No thread_id provided.")
        raise HTTPException(status_code=400, detail="thread_id is required")

    # Ensure session exists
    print("[stream_chat] Checking session in DB...")
    session = await sessions_collection.find_one({"thread_id": thread_id})
    print("[stream_chat] DB session result:", session)
    if not session:
        print("[stream_chat] Session not found; creating new session.")
        await sessions_collection.insert_one({
            "thread_id": thread_id,
            "title": "New Chat",
            "messages": []
        })
        session = {"messages": []}
    else:
        print("[stream_chat] Session exists.")

    # Condense older history (summary pair + last N turns)
    print("[stream_chat] Consolidating history...")
    await consolidate_with_summary_pair(thread_id, keep_turns=4, threshold_turns=10)
    session = await sessions_collection.find_one({"thread_id": thread_id}) or {"messages": []}
    print("[stream_chat] Session after consolidation:", session)

    # Build context with summary pair + tail + incoming user message
    print("[stream_chat] Building context for streaming...")
    ctx_msgs, summary_present = await build_context_with_summary(
        session_messages=session.get("messages", []),
        new_user_msg=message
    )
    print("[stream_chat] Context built. summary_present:", summary_present, "ctx_msgs_len:", len(ctx_msgs))

    # Save human message immediately
    print("[stream_chat] Persisting incoming human message to DB...")
    await sessions_collection.update_one(
        {"thread_id": thread_id},
        {"$push": {"messages": {"role": "human", "content": message}}}
    )
    print("[stream_chat] Incoming human message persisted.")

    async def event_generator():
        print("[event_generator] Generator started for thread_id:", thread_id)
        ai_content = ""  # collected from primary model stream (if any)
        final_synth_text = ""  # collected from final synthesis LLM (if run)
        tool_logs_buffer = []

        # initial heartbeat to avoid buffering issues
        print("[event_generator] Sending initial SSE heartbeat/retry")
        yield "retry: 1000\n\n"
        yield ": connected\n\n"
        print("[event_generator] Heartbeat yielded")

        # --- TOOL MAP: map tool names to actual callables (imported earlier) ---
        try:
            from src.tools.calculator_tool import calculator_tool
            from src.tools.web_search_tool import duckduckgo_search_tool
            from src.tools.webscrapper_tool import webscrapper_tool
            tool_map = {
                "calculator": calculator_tool,
                "duckduckgo_search_tool": duckduckgo_search_tool,
                "webscrapper_tool": webscrapper_tool,
            }
            print("[event_generator] Tool map prepared:", list(tool_map.keys()))
        except Exception as e:
            print("[event_generator][ERROR] Failed to import tools:", str(e))
            tool_map = {}

        # Helper: collect tool entries from tool_logs_buffer (end-phase only)
        def collect_tool_entries_from_buffer(buffer):
            entries = []
            # match end-phase records
            for entry in buffer:
                try:
                    if entry.get("phase") == "end":
                        # find start args for this call_id if present
                        start_args = next(
                            (x.get("args") for x in buffer if x.get("phase") == "start" and x.get("call_id") == entry.get("call_id") and x.get("tool_name") == entry.get("tool_name")),
                            {}
                        )
                        entries.append({
                            "tool_name": entry.get("tool_name"),
                            "call_id": entry.get("call_id"),
                            "args": start_args or {},
                            "result": entry.get("result"),
                        })
                except Exception:
                    continue
            return entries

        # Helper: compose compact summary of tool outputs for final LLM
        def compose_tool_summary(entries):
            if not entries:
                return ""
            lines = []
            for t in entries:
                try:
                    name = t.get("tool_name") or "tool"
                    cid = t.get("call_id") or ""
                    args = t.get("args") or {}
                    result = t.get("result")
                    # stringify safely
                    try:
                        args_s = json.dumps(args, ensure_ascii=False)
                    except Exception:
                        args_s = str(args)
                    try:
                        result_s = json.dumps(result, ensure_ascii=False) if isinstance(result, (dict, list)) else str(result)
                    except Exception:
                        result_s = str(result)
                    snippet = result_s if len(result_s) <= 600 else (result_s[:600] + " ... [truncated]")
                    header = f"- {name}"
                    if cid:
                        header += f" (call_id: {cid})"
                    if args_s:
                        header += f", args: {args_s[:200]}"
                    header += f"\n  result: {snippet}"
                    lines.append(header)
                except Exception:
                    continue
            return "\n".join(lines)

        # Helper: final synthesis streaming using LLM (no tools bound)
        async def run_final_synthesis_and_stream(entries, last_human_text):
            nonlocal final_synth_text
            if not entries:
                return

            tool_summary = compose_tool_summary(entries)
            if not tool_summary.strip():
                return

            system = SystemMessage(content=(
                "You are a concise assistant. Use the tool outputs below to answer the user's question. "
                "Do not invent new facts. When you mention a fact, indicate the tool name in brackets."
            ))

            user_prompt = HumanMessage(content=(
                f"User question: {last_human_text}\n\n"
                "Tool outputs (recent):\n"
                f"{tool_summary}\n\n"
                "Using only the information above, write a short (2-6 sentence) answer. "
                "Cite tools in brackets like [duckduckgo_search_tool] where helpful."
            ))

            # Use an LLM instance WITHOUT tools bound for final synthesis
            final_llm = LLMGroq().model  # no tools bound
            print("[event_generator] Starting final LLM synthesis (no tools bound)")

            # Stream tokens from final LLM and forward as token SSE events
            try:
                async for chunk in final_llm.astream([system, user_prompt]):
                    try:
                        content = getattr(chunk, "content", None) or (chunk.get("content") if isinstance(chunk, dict) else "")
                        if content:
                            final_synth_text += content
                            payload = {"text": content}
                            yield f"event: token\ndata: {safe_json_dumps(payload)}\n\n"
                    except Exception:
                        continue
            except Exception as e:
                # log but don't crash
                print("[event_generator][ERROR] final_llm.astream failed:", str(e))

            # After streaming, send final synthesized message event (so frontend receives 'message' type)
            if final_synth_text.strip():
                try:
                    final_payload = {"text": final_synth_text}
                    yield f"event: message\ndata: {safe_json_dumps(final_payload)}\n\n"
                except Exception:
                    pass

        # Use robust handling for the async iterator (main model run)
        try:
            async for event in chatbot_graph.astream_events(
                {"messages": ctx_msgs},
                config={"configurable": {"thread_id": thread_id}},
                version="v2",
            ):
                # Build a tiny safe summary for logging only
                try:
                    summary = safe_event_summary(event)
                    print(f"[event_generator] Received event: etype={summary['event']}, name={summary['name']}, data_keys={summary['data_keys']}")
                except Exception:
                    print("[event_generator] Received event: <uninspectable>")

                # early disconnect check
                try:
                    if await request.is_disconnected():
                        print("[event_generator] Client disconnected; breaking loop.")
                        break
                except Exception:
                    # If checking disconnect fails, continue and rely on outer controls
                    pass

                # Attempt to extract type/name/data in a safe way
                etype = None
                name = None
                data = None
                try:
                    if hasattr(event, "event"):
                        etype = getattr(event, "event")
                    elif isinstance(event, dict):
                        etype = event.get("event")
                except Exception:
                    etype = None

                try:
                    if hasattr(event, "name"):
                        name = getattr(event, "name")
                    elif isinstance(event, dict):
                        name = event.get("name")
                except Exception:
                    name = None

                try:
                    if hasattr(event, "data"):
                        data = getattr(event, "data")
                    elif isinstance(event, dict):
                        data = event.get("data", {}) or {}
                    else:
                        data = {}
                except Exception:
                    data = {}

                # --- Assistant streaming tokens (text) ---
                if etype == "on_chat_model_stream":
                    chunk = {}
                    try:
                        # chunk might be at data["chunk"] or attribute on data
                        if isinstance(data, dict) and "chunk" in data:
                            chunk = data["chunk"]
                        elif hasattr(data, "chunk"):
                            chunk = getattr(data, "chunk")
                        else:
                            chunk = data
                    except Exception:
                        chunk = data

                    text = ""
                    try:
                        text = getattr(chunk, "content", None) or (chunk.get("content") if isinstance(chunk, dict) else "")
                    except Exception:
                        text = ""

                    if text:
                        ai_content += text
                        payload = {"text": text}
                        yield f"event: token\ndata: {safe_json_dumps(payload)}\n\n"

                    # --- detect tool calls safely ---
                    tool_calls = []
                    try:
                        if hasattr(chunk, "tool_calls") and getattr(chunk, "tool_calls"):
                            tool_calls = getattr(chunk, "tool_calls") or []
                        elif isinstance(chunk, dict) and chunk.get("tool_calls"):
                            tool_calls = chunk.get("tool_calls") or []
                        elif isinstance(data, dict) and data.get("chunk") and isinstance(data["chunk"], dict): #type: ignore
                            tool_calls = data["chunk"].get("tool_calls", []) or [] #type: ignore
                    except Exception:
                        tool_calls = []

                    if tool_calls:
                        for tc in tool_calls:
                            try:
                                t_name = tc.get("name") or (tc.get("function", {}) or {}).get("name") or tc.get("tool_name")
                                t_args = tc.get("args") or {}
                                t_id = tc.get("id") or tc.get("call_id") or str(uuid.uuid4())

                                call_payload = {"tool_name": t_name, "call_id": t_id, "args": t_args}
                                tool_logs_buffer.append({"phase": "start", **call_payload})
                                yield f"event: tool_call\ndata: {safe_json_dumps(call_payload)}\n\n"

                                tool_fn = tool_map.get(t_name)
                                if tool_fn is None:
                                    result = {"error": f"No tool implementation for {t_name}"}
                                else:
                                    try:
                                        result = await asyncio.to_thread(lambda: tool_fn(**t_args))  # type: ignore
                                    except TypeError:
                                        try:
                                            result = await asyncio.to_thread(lambda: tool_fn(t_args))  # type: ignore
                                        except Exception as e:
                                            print("[event_generator][ERROR] Tool call TypeError:", str(e))
                                            result = {"error": str(e)}
                                    except Exception as e:
                                        print("[event_generator][ERROR] Tool call failed:", str(e))
                                        result = {"error": str(e)}

                                # normalize result through safe_json_dumps -> load back
                                try:
                                    r_json = safe_json_dumps(result)
                                    try:
                                        safe_result = json.loads(r_json)
                                    except Exception:
                                        safe_result = str(result)
                                except Exception:
                                    safe_result = str(result)

                                end_payload = {"tool_name": t_name, "call_id": t_id, "result": safe_result}
                                tool_logs_buffer.append({"phase": "end", **end_payload})
                                yield f"event: tool_result\ndata: {safe_json_dumps(end_payload)}\n\n"

                            except Exception as e:
                                print("[event_generator][EXCEPTION] while processing tool_call:", str(e))
                                err_payload = {"tool_name": tc.get("name", "unknown"), "call_id": tc.get("id", None), "result": {"error": str(e)}}
                                tool_logs_buffer.append({"phase": "end", **err_payload})
                                try:
                                    yield f"event: tool_result\ndata: {safe_json_dumps(err_payload)}\n\n"
                                except Exception:
                                    pass

                elif etype == "on_tool_start" and name:
                    try:
                        call_id = data.get("call_id") or str(uuid.uuid4()) if isinstance(data, dict) else str(uuid.uuid4())
                        args = data.get("input", {}) or {} if isinstance(data, dict) else {}
                        payload = {"tool_name": name, "call_id": call_id, "args": args}
                        tool_logs_buffer.append({"phase": "start", **payload})
                        yield f"event: tool_call\ndata: {safe_json_dumps(payload)}\n\n"
                    except Exception:
                        pass

                elif etype == "on_tool_end" and name:
                    try:
                        call_id = data.get("call_id") if isinstance(data, dict) else None
                        output = data.get("output") if isinstance(data, dict) else None
                        try:
                            safe_output = json.loads(safe_json_dumps(output))
                        except Exception:
                            safe_output = str(output)
                        payload = {"tool_name": name, "call_id": call_id, "result": safe_output}
                        tool_logs_buffer.append({"phase": "end", **payload})
                        yield f"event: tool_result\ndata: {safe_json_dumps(payload)}\n\n"
                    except Exception:
                        pass

                else:
                    # unhandled event type - ignore
                    pass

                # small sleep to avoid tight loop
                try:
                    await asyncio.sleep(0.005)
                except Exception:
                    pass

        except Exception as e:
            # Robustly handle exceptions arising from the async iterator itself.
            # Use str(e) (not repr) to avoid Pydantic repr internals triggering serialization.
            msg = str(e)
            print("[event_generator][EXCEPTION] Exception while iterating astream_events:", msg)
            try:
                err_payload = {"error": msg}
                yield f"event: error\ndata: {safe_json_dumps(err_payload)}\n\n"
                print("[event_generator] Yielded error event to client")
            except Exception:
                print("[event_generator][ERROR] Failed to yield error event")

        # --- After the main model run: if tools were invoked, synthesize a final assistant response ---
        try:
            # Collect only the recently completed tool outputs
            tool_entries = collect_tool_entries_from_buffer(tool_logs_buffer)
            # Find last human message text (most recent)
            last_human_text = ""
            try:
                # read from the session saved earlier (or ctx_msgs)
                for m in reversed(ctx_msgs):
                    try:
                        if getattr(m, "content", None) and m.__class__.__name__.lower().startswith("humanmessage"):
                            last_human_text = getattr(m, "content")
                            break
                    except Exception:
                        # fallback for dict-like messages
                        if isinstance(m, dict) and m.get("role") == "human" and m.get("content"):
                            last_human_text = m.get("content")
                            break
            except Exception:
                last_human_text = message

            # If there are tool outputs, stream a final LLM-based synthesis back to client
            if tool_entries:
                # run_final_synthesis_and_stream is a generator that yields SSE lines
                async for sline in run_final_synthesis_and_stream(tool_entries, last_human_text):
                    # sline is already a SSE line string (token or message)
                    yield sline

        except Exception as e:
            print("[event_generator][ERROR] during final synthesis:", str(e))

        # --- Persist AI + tool logs ---
        print("[event_generator] Preparing to persist AI content and tool logs. ai_content length:", len(ai_content), "final_synth_text length:", len(final_synth_text))

        # --- BUILD OPS: persist tool entries FIRST, then AI message (so UI shows tools before answer) ---
        ops: list = []

        # Build tool ops from tool_logs_buffer (only 'end' phase)
        tool_ops = []
        for t in tool_logs_buffer:
            if t.get("phase") == "end":
                start_args = next(
                    (x.get("args") for x in tool_logs_buffer if x.get("phase") == "start" and x.get("tool_name") == t.get("tool_name") and x.get("call_id") == t.get("call_id")),
                    {}
                )
                try:
                    serialized = safe_json_dumps(t.get("result"))
                    try:
                        result_serialized = json.loads(serialized)
                    except Exception:
                        result_serialized = str(t.get("result"))
                except Exception:
                    result_serialized = str(t.get("result"))

                content_json = json.dumps({
                    "args": start_args or {},
                    "result": result_serialized,
                    "call_id": t.get("call_id"),
                }, default=str)

                escaped_content = content_json.replace("{", "{{").replace("}", "}}")
                tool_ops.append({
                    "role": "tool",
                    "name": t.get("tool_name"),
                    "content": escaped_content,
                })

        # append tool_ops first (if any)
        if tool_ops:
            ops.extend(tool_ops)
            print(f"[event_generator] Prepared {len(tool_ops)} tool op(s) for persistence.")

        # prefer final_synth_text for persisted AI if present; otherwise persist ai_content
        ai_to_persist = final_synth_text.strip() or ai_content.strip()
        if ai_to_persist:
            ops.append({"role": "ai", "content": ai_to_persist})
            print("[event_generator] Appended AI content to ops.")

        if ops:
            print("[event_generator] About to write ops to MongoDB:", len(ops))
            try:
                await sessions_collection.update_one(
                    {"thread_id": thread_id},
                    {"$push": {"messages": {"$each": ops}}}
                )
                print("[event_generator] Ops persisted to MongoDB.")
                await generate_session_title(thread_id)
                print("[event_generator] generate_session_title completed.")
            except Exception as e:
                print("[event_generator][ERROR] Failed to persist ops:", str(e))

        # --- Send final + done (if not already sent by final synthesis streaming) ---
        # If we didn't stream a final human-readable message earlier, send aggregated ai_content as message
        if not final_synth_text.strip() and ai_content.strip():
            try:
                final_payload = {"text": ai_content}
                yield f"event: message\ndata: {safe_json_dumps(final_payload)}\n\n"
            except Exception:
                pass

        # final done marker
        yield "event: done\ndata: {}\n\n"
        print("[event_generator] Generator finished normally.")

    print("[stream_chat] Returning StreamingResponse.")
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
