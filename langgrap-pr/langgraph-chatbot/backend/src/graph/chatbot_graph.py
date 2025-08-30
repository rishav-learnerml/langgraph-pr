from langgraph.graph import StateGraph, START, END
from src.state.chat_state import ChatState
from src.nodes.chat_node import chat_node
from langgraph.checkpoint.memory import MemorySaver

class ChatbotState:
    def __init__(self) -> None:
        self.graph=StateGraph(ChatState)
        self.checkpointer=MemorySaver()

    def build_graph(self):
        #add nodes
        self.graph.add_node('chat_node',chat_node)

        #add edges
        self.graph.add_edge(START,'chat_node')
        self.graph.add_edge('chat_node',END)
        
        return self.graph.compile(checkpointer=self.checkpointer)
