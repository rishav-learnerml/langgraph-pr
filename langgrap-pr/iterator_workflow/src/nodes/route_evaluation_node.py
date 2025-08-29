from src.state.job_post_state import JobPostState

def route_evaluation(state: JobPostState):
    iterations = state.get('iterations', 0)  # type: ignore
    max_iterations = state.get('max_iterations', 1)  # type: ignore
    if state.get('evaluation', 'needs_improvements') == 'approved' or iterations >= max_iterations:  # type: ignore
        return 'approved'
    else:
        return 'needs_improvements'