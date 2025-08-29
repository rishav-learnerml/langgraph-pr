from langgraph.graph import StateGraph,START,END
from src.state.job_post_state import JobPostState
from src.nodes.generate_job_post_node import generate_job_post
from src.nodes.evaluate_job_post import evaluate_job_post
from src.nodes.optimise_job_post import optimise_job_post
from src.nodes.route_evaluation_node import route_evaluation

class JobPostGraph(StateGraph):
    def __init__(self):
        self.graph=StateGraph(JobPostState)

    def build_graph(self):
        self.graph.add_node('generate',generate_job_post)
        self.graph.add_node('evaluate',evaluate_job_post)
        self.graph.add_node('optimise',optimise_job_post)

        self.graph.add_edge(START,'generate')
        self.graph.add_edge('generate','evaluate')

        self.graph.add_conditional_edges('evaluate',route_evaluation,{
            'approved':END,
            'needs_improvements':'optimise'
        })
        self.graph.add_edge('optimise','evaluate')

        return self.graph.compile()


    