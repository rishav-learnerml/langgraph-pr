from langgraph.graph import StateGraph, START, END
from src.state.ReviewState import ReviewState
from src.nodes.find_sentiment_node import find_sentiment
from src.nodes.check_sentiment_node import check_sentiment
from src.nodes.positive_response_node import positive_response
from src.nodes.run_diagnosys_node import run_diagnosis
from src.nodes.negetive_response_node import negetive_response

class SentimentGraph(StateGraph):
    def __init__(self,llm):
        self.llm=llm
        self.graph=StateGraph(ReviewState)
        
    def build_graph(self):
        self.graph.add_node('find_sentiment',find_sentiment) #type: ignore
        self.graph.add_node('positive_response',positive_response) #type: ignore
        self.graph.add_node('run_diagnosis',run_diagnosis) #type: ignore
        self.graph.add_node('negetive_response',negetive_response) #type: ignore


        self.graph.add_edge(START,'find_sentiment')
        self.graph.add_conditional_edges('find_sentiment', check_sentiment)
        self.graph.add_edge('positive_response',END)
        self.graph.add_edge('run_diagnosis','negetive_response')
        self.graph.add_edge('negetive_response',END)

        return self.graph.compile()