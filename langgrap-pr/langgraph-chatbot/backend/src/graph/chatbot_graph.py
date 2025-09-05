# src/graph/chatbot_graph.py
from langgraph.graph import StateGraph, START, END
from src.state.chat_state import ChatState
from src.nodes.chat_node import chat_node
from src.nodes.modify_query import modify_user_query_node
from langgraph.prebuilt import ToolNode, tools_condition

from src.tools.calculator_tool import calculator_tool
from src.tools.web_search_tool import duckduckgo_search_tool
from src.tools.webscrapper_tool import webscrapper_tool


class ChatbotGraph:
    def __init__(self) -> None:
        # do not create Graph here if you want to allow multiple builds with different checkpointers
        self.graph = None

    def build_graph(self, checkpointer=None):
        """
        Build and compile the state graph with correct wiring:

          START -> modify_user_query -> chat_node
                     chat_node --(tools_condition)--> tools
                     tools -> chat_node  (loop back after tool execution)
                     chat_node -> END      (implicit/explicit finalization)

        Notes:
        - The 'tools' node must be named 'tools' to work with tools_condition.
        - modify_user_query is expected to be a node function that enriches/normalizes the incoming query.
        """
        # create a fresh graph each time to avoid duplicate node additions
        self.graph = StateGraph(ChatState)

        # Nodes
        self.graph.add_node("modify_user_query", modify_user_query_node)
        self.graph.add_node("chat_node", chat_node)

        # Tool execution node – must be named 'tools' for tools_condition to detect it
        tools_list = [calculator_tool, duckduckgo_search_tool, webscrapper_tool]
        self.graph.add_node("tools", ToolNode(tools_list))  # type: ignore

        # Edges wiring
        # Start -> modify_user_query -> chat_node
        self.graph.add_edge(START, "modify_user_query")
        self.graph.add_edge("modify_user_query", "chat_node")

        # From chat_node decide whether to call tools (tools_condition handles detection)
        self.graph.add_conditional_edges("chat_node", tools_condition)

        # After tools finish, return to chat_node for the LLM to consume tool results
        self.graph.add_edge("tools", "chat_node")
        self.graph.add_edge("chat_node", END)

        # Optional: if you want chat_node to be able to end the flow explicitly:
        # (you can omit this if your chat_node handles finishing itself)
        # self.graph.add_edge("chat_node", END)

        # compile (optionally with checkpointer)
        if checkpointer is None:
            return self.graph.compile()
        return self.graph.compile(checkpointer=checkpointer)
