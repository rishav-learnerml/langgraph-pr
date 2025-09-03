from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn
from src.graph.chatbot_graph import ChatbotState
from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate
import uuid
import asyncio
from src.llm.lllm_groq import LLMGroq

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow your frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    thread_id: str | None = None


chatbot_state = ChatbotState()
chatbot_graph = chatbot_state.build_graph()

# in-memory session store
# { session_id: {"title": str, "messages": [{"role": "human"/"ai", "content": str}]} }
session_store = {}


# ------------------------------
# Title generator
# ------------------------------
async def generate_session_title(thread_id: str):
    """Generate a short session title (4–5 words) if conditions are met."""
    session = session_store.get(thread_id)
    if not session:
        return

    # Only generate if still "New Chat" AND we have both human + ai messages
    if session["title"] != "New Chat":
        return
    roles = {m["role"] for m in session["messages"]}
    if not {"human", "ai"}.issubset(roles):
        return

    # Prepare context (use first human + ai pair for better titles)
    convo_text = "\n".join(
        [f"{m['role'].capitalize()}: {m['content']}" for m in session["messages"][:2]]
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an assistant that creates very short chat titles."),
        ("user", f"Read the conversation below and give a concise 4 or 5 word title.\n\n{convo_text}/n only give the title and not any extra word")
    ])

    chain = prompt | LLMGroq().model  # reuse LLM from your chatbot state # type: ignore
    title = await chain.ainvoke({})
    session["title"] = title.content.strip('" ')#type:ignore


# ------------------------------
# Routes
# ------------------------------

@app.get("/")
async def read_root():
    return {"message": "Chatbot FastAPI is running!"}


# legacy (non-streaming)
@app.post("/chat")
async def chat_with_bot(request: ChatRequest):
    try:
        thread_id = request.thread_id or str(uuid.uuid4())

        # create session only if message exists
        if thread_id not in session_store:
            session_store[thread_id] = {"title": "New Chat", "messages": []}

        # add human message
        session_store[thread_id]["messages"].append({"role": "human", "content": request.message})

        response = chatbot_graph.invoke(
            {"messages": [HumanMessage(content=request.message)]},
            {"configurable": {"thread_id": thread_id}}
        )

        bot_message = response["messages"][-1].content if response.get("messages") else "No response from bot"

        # add ai message
        session_store[thread_id]["messages"].append({"role": "ai", "content": bot_message})

        # ✅ generate title immediately
        await generate_session_title(thread_id)

        return {"response": bot_message, "thread_id": thread_id}
    except Exception as e:
        return {"error": str(e)}


# streaming
@app.get("/stream-chat")
async def stream_chat(
    request: Request,
    message: str = Query(..., description="User message"),
    thread_id: str = Query(..., description="Conversation thread ID (required)"),
):
    if not thread_id:
        raise HTTPException(status_code=400, detail="thread_id is required")

    if thread_id not in session_store:
        session_store[thread_id] = {"title": "New Chat", "messages": []}

    # add human message immediately
    session_store[thread_id]["messages"].append({"role": "human", "content": message})

    async def event_generator():
        ai_content = ""
        async for msg_chunk, metadata in chatbot_graph.astream(
            {"messages": [HumanMessage(content=message)]},
            {"configurable": {"thread_id": thread_id}},  # ✅ always provided
            stream_mode="messages"  # type:ignore
        ):
            if getattr(msg_chunk, "content", None) and msg_chunk.content.strip():  # type:ignore
                chunk_text = msg_chunk.content  # type: ignore
                ai_content += chunk_text
                yield f"data: {chunk_text}\n\n"
                await asyncio.sleep(0.02)

            if await request.is_disconnected():
                break

        # save ai response
        if ai_content.strip():
            session_store[thread_id]["messages"].append({"role": "ai", "content": ai_content})
            # ✅ generate title immediately
            await generate_session_title(thread_id)

        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# chat history
@app.get("/chathistory/{thread_id}")
async def chat_history(thread_id: str):
    if thread_id not in session_store:
        # ⚠️ don’t create empty sessions anymore
        raise HTTPException(status_code=404, detail="Session not found")
    return session_store[thread_id]


# all sessions
@app.get("/sessions")
async def all_sessions():
    """Return all session ids with titles (not messages) for sidebar/history list."""
    return [{"thread_id": sid, "title": data["title"]} for sid, data in session_store.items()]


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
