# src/nodes/chat_node.py
from src.state.chat_state import ChatState
from src.llm.lllm_groq import LLMGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from src.tools.calculator_tool import calculator_tool
from src.tools.web_search_tool import duckduckgo_search_tool
from src.tools.webscrapper_tool import webscrapper_tool
from typing import List, Dict, Any, Optional
import json
import asyncio

# ------------------ helpers ------------------

def _safe_try_parse_json(s: str) -> Any:
    try:
        return json.loads(s)
    except Exception:
        return None

def _normalize_tool_message(msg: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Normalize a message object into a tool entry:
      {"tool_name", "args", "result", "call_id", "raw"}
    Return None if the message doesn't look like a tool record.
    """
    try:
        meta = msg.get("meta") or {}
        if meta:
            tool_name = meta.get("tool_name") or meta.get("toolName") or meta.get("name")
            args = meta.get("args") or meta.get("input") or meta.get("arguments") or None
            result = meta.get("result") or meta.get("output") or meta.get("content") or None
            call_id = meta.get("call_id") or meta.get("toolCallId") or meta.get("callId") or None
            if tool_name or result:
                return {"tool_name": tool_name or "tool", "args": args, "result": result, "call_id": call_id, "raw": msg}

        # fallback: try parsing message.content as JSON or extracting JSON substring
        content = msg.get("content") or ""
        if isinstance(content, str) and content.strip():
            parsed = _safe_try_parse_json(content)
            if isinstance(parsed, dict):
                tool_name = parsed.get("tool_name") or parsed.get("name") or parsed.get("tool")
                args = parsed.get("args") or parsed.get("input")
                result = parsed.get("result") or parsed.get("output") or parsed.get("content")
                call_id = parsed.get("call_id") or parsed.get("id") or None
                if tool_name or result:
                    return {"tool_name": tool_name or "tool", "args": args, "result": result, "call_id": call_id, "raw": msg}
            # try JSON substring between first { and last }
            if "{" in content and "}" in content:
                try:
                    first = content.index("{")
                    last = content.rindex("}") + 1
                    sub = content[first:last]
                    parsed2 = _safe_try_parse_json(sub)
                    if isinstance(parsed2, dict):
                        tool_name = parsed2.get("tool_name") or parsed2.get("name") or parsed2.get("tool")
                        args = parsed2.get("args") or parsed2.get("input")
                        result = parsed2.get("result") or parsed2.get("output") or parsed2.get("content")
                        call_id = parsed2.get("call_id") or parsed2.get("id") or None
                        if tool_name or result:
                            return {"tool_name": tool_name or "tool", "args": args, "result": result, "call_id": call_id, "raw": msg}
                except Exception:
                    pass
        return None
    except Exception:
        return None

def compose_tool_summary(tool_entries: List[Dict[str, Any]]) -> str:
    """
    Convert normalized tool entries into a compact human-readable summary for final LLM.
    """
    if not tool_entries:
        return ""

    lines = []
    for t in tool_entries:
        name = t.get("tool_name") or "tool"
        cid = t.get("call_id")
        result = t.get("result")
        # stringify small result
        if isinstance(result, (dict, list)):
            try:
                rstr = json.dumps(result, ensure_ascii=False)
            except Exception:
                rstr = str(result)
        else:
            rstr = str(result) if result is not None else ""
        if len(rstr) > 600:
            short = rstr[:600] + " ... [truncated]"
        else:
            short = rstr
        args = t.get("args")
        args_str = ""
        if args:
            try:
                args_str = json.dumps(args, ensure_ascii=False)
            except Exception:
                args_str = str(args)
            if len(args_str) > 180:
                args_str = args_str[:180] + " ..."

        header = f"- {name}"
        if cid:
            header += f" (call_id: {cid})"
        if args_str:
            header += f", args: {args_str}"
        header += f"\n  result: {short}"
        lines.append(header)
    return "\n".join(lines)

# ------------------ collection of recent tool outputs ------------------

def collect_tool_entries_from_current_turn(state: ChatState) -> List[Dict[str, Any]]:
    """
    Return normalized tool entries that appeared *after* the most recent human message
    in state["messages"]. This ensures we only include tool calls made during the
    current assistant turn / interaction.
    """
    msgs = state.get("messages", []) or []
    # find index of most recent human message (last occurrence)
    last_human_idx = -1
    for idx in range(len(msgs) - 1, -1, -1):
        m = msgs[idx]
        try:
            if isinstance(m, dict) and m.get("role") == "human":
                last_human_idx = idx
                break
        except Exception:
            continue

    # collect messages after last_human_idx
    recent = []
    for m in msgs[last_human_idx + 1 :]:
        if not isinstance(m, dict):
            continue
        # treat messages with role "tool" specially, and otherwise attempt normalization
        if m.get("role") == "tool":
            norm = _normalize_tool_message(m)
            if norm:
                recent.append(norm)
            else:
                # try fallback parse from content
                try:
                    parsed = _safe_try_parse_json(m.get("content") or "")
                    if isinstance(parsed, dict):
                        recent.append({
                            "tool_name": parsed.get("tool_name") or parsed.get("name") or "tool",
                            "args": parsed.get("args") or parsed.get("input"),
                            "result": parsed.get("result") or parsed.get("output") or parsed.get("content"),
                            "call_id": parsed.get("call_id") or parsed.get("id")
                        })
                except Exception:
                    pass
        else:
            # message may be an inserted tool log (content contains "tool result")
            norm = _normalize_tool_message(m)
            if norm:
                recent.append(norm)
    return recent

# ------------------ final synthesis streaming ------------------

async def stream_final_synthesis(tool_entries: List[Dict[str, Any]], last_human_text: str):
    """
    Use a fresh LLM (not bound to tools) to synthesize a final assistant reply
    based on the provided tool_entries and the user's last question. Stream tokens.
    Yields chunks in the same shape as upstream streaming (i.e., {"messages":[chunk]})
    so chat_node can forward them to the client.
    """
    if not tool_entries:
        return

    tool_summary = compose_tool_summary(tool_entries)

    system = SystemMessage(content=(
        "You are a helpful assistant. Below are verified tool outputs. Using only the information "
        "presented, produce a concise, human-facing answer to the user's question. "
        "When you mention a fact, briefly indicate which tool supplied it in parentheses. "
        "Do NOT print raw tool JSON — summarize and use plain language. If results disagree, state the discrepancy and suggest next steps."
        "Use multiple available tools to give a proper response in a human like manner"
    ))

    user_prompt = HumanMessage(content=(
        f"User question: {last_human_text}\n\n"
        "Tool outputs (most recent first):\n"
        f"{tool_summary}\n\n"
        "Now write a short (2-6 sentences) final answer to the user's question using the tool outputs above. "
        "Keep the answer direct and include short citations like [duckduckgo_search_tool] where it helps."
    ))

    prompt_msgs = [system, user_prompt]

    # Use an LLM instance WITHOUT tools bound for final synthesis
    final_llm = LLMGroq().model  # no tools
    # Stream tokens
    async for chunk in final_llm.astream(prompt_msgs):
        if chunk.content:
            # yield the chunk message for the runtime (consistent with how earlier streaming yields)
            yield {"messages": [chunk]}

    # After streaming finishes, request a single final completion to ensure we can persist the full text
    try:
        # Use ainvoke to get the complete final response object
        final_resp = await final_llm.ainvoke({"messages": prompt_msgs}) #type: ignore
        final_text = getattr(final_resp, "content", None) or (final_resp and final_resp.get("content")) or str(final_resp)   # type: ignore
        final_text = (final_text or "").strip()
        if final_text:
            yield {"messages": [AIMessage(content=final_text)]}
    except Exception:
        # if ainvoke fails, ignore — streaming chunks likely already provided user-readable output
        return

# ------------------ main chat_node ------------------

async def chat_node(state: ChatState):
    """
    Streaming chat_node that:
      - streams the model that may call tools (unchanged behavior)
      - after that streaming completes, collects only the tool outputs produced
        during the current turn and streams a final LLM-synthesized answer based on them.
    """
    # System prompt and few_shots (you can reuse your earlier few_shots)
    system_prompt = SystemMessage(
        content=(
            "You are a helpful, precise assistant. Use tools sparingly and only when you "
            "cannot confidently answer using the prompt + conversation context.\n\n"

            "DECISION RULES (be strict):\n"
            "1) Do NOT call a tool when the user asks you to produce code, examples, or explanations that do not require external facts.\n"
            "2) Call a tool when you need external information or to run computation that the runtime provides.\n"
            "3) When you decide to call a tool, output EXACTLY one line with this syntax and nothing else:\n"
            "   CALL_TOOL <tool_name> <JSON-args>\n"
            "4) AFTER TOOL RETURN: either emit another CALL_TOOL or emit a final human-facing reply.\n"
        )
    )

    # Insert your few_shots examples here (same as your previous few_shots)
    few_shots = [
        # Keep your helpful few-shots for tool/no-tool examples
        HumanMessage(content="python function to add two numbers"),
        AIMessage(content="```python\n...\n```"),
        # (add other shots as you had them)
    ]

    # Build messages for streaming model (bound to tools)
    messages = [system_prompt] + few_shots + state["messages"]

    # Bind the tools so the model can legitimately call them when it emits CALL_TOOL
    llm_with_tools = LLMGroq(tools=[calculator_tool, duckduckgo_search_tool, webscrapper_tool]).model

    # 1) Stream the main model (may emit CALL_TOOL, which runtime will handle)
    async for chunk in llm_with_tools.astream(messages):
        if chunk.content:  # type: ignore
            yield {"messages": [chunk]}

    # 2) After that streaming completes, gather tool outputs from the current turn only
    try:
        tool_entries = collect_tool_entries_from_current_turn(state)
        # find last human message text (most recent)
        last_human_text = ""
        for m in reversed(state.get("messages", []) or []):
            if isinstance(m, dict) and m.get("role") == "human" and m.get("content"):
                last_human_text = m.get("content")
                break

        # If we have tool outputs, stream a final synthesized answer that uses them
        if tool_entries:
            async for synth_chunk in stream_final_synthesis(tool_entries, last_human_text):
                # synth_chunk already shaped as {"messages":[chunk]} or final AIMessage
                yield synth_chunk
    except Exception:
        # swallow errors to avoid breaking the overall chat flow
        pass

    # Do not return a value from an async generator — just finish.
    # function ends here
