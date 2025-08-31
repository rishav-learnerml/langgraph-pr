from src.state.chat_state import ChatState
from src.llm.lllm_groq import LLMGroq

async def chat_node(state: ChatState):
    messages = state["messages"]
    llm = LLMGroq().model

    async for chunk in llm.astream(messages):
        if chunk.content:
            # Yield partial state update back into graph
            yield {"messages": [chunk]}
