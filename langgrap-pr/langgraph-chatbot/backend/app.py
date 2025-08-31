from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn
from src.graph.chatbot_graph import ChatbotState
from langchain_core.messages import HumanMessage
from src.llm.lllm_groq import LLMGroq
import uuid
import asyncio

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
thread_id = str(uuid.uuid4())


@app.get("/")
async def read_root():
    return {"message": "Chatbot FastAPI is running!"}


@app.post("/chat")
async def chat_with_bot(request: ChatRequest):
    try:
        response = chatbot_graph.invoke(
            {"messages": [HumanMessage(content=request.message)]},
            {"configurable": {"thread_id": thread_id}}
        )
        bot_message = response["messages"][-1].content if response.get("messages") else "No response from bot"
        return {"response": bot_message}
    except Exception as e:
        return {"error": str(e)}


@app.get("/stream-chat")
async def stream_chat(request: Request, message: str):
    async def event_generator():
        async for msg_chunk, metadata in chatbot_graph.astream(
            {"messages": [HumanMessage(content=message)]},
            {"configurable": {"thread_id": thread_id}},
            stream_mode="messages" #type:ignore
        ):
            # msg_chunk is AIMessageChunk
            if getattr(msg_chunk, "content", None) and msg_chunk.content.strip(): #type:ignore
                yield f"data: {msg_chunk.content}\n\n" #type:ignore
                await asyncio.sleep(0.02)

            if await request.is_disconnected():
                break

        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream",)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
