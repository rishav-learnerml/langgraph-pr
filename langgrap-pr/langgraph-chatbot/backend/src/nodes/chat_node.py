from src.state.chat_state import ChatState
from src.llm.lllm_groq import LLMGroq

def chat_node(state:ChatState):
    # extract user query from state
    messages = state['messages']

    # make llm call
    llm = LLMGroq()
    response=llm.model.invoke(messages)

    #response store in state
    return {'messages':[response]}
