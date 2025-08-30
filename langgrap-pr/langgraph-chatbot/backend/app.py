from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from src.graph.chatbot_graph import ChatbotState
from langchain_core.messages import HumanMessage


app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Allow your frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


chatbot_state = ChatbotState()
chatbot_graph = chatbot_state.build_graph()


@app.get("/")
async def read_root():
    return {"message": "Chatbot FastAPI is running!"}


@app.post("/chat")
async def chat_with_bot(request: ChatRequest):
    try:
        thread_id='1'
        # Invoke the chatbot with the user's message
        response = chatbot_graph.invoke(
            {"messages": [HumanMessage(content=request.message)]},
            {
                'configurable':{'thread_id':thread_id}
            }
        )
        # Extract the last message from the response
        # Assuming the response structure contains 'messages' and the last one is the bot's reply
        bot_message = response["messages"][-1].content if response.get("messages") else "No response from bot"
        return {"response": bot_message}
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
