from fastapi import FastAPI
from pydantic import BaseModel
from src.graph.job_post_graph import JobPostGraph
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI app
app = FastAPI(title="Job Post Generator API")

#cors
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust as needed for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request schema
class JobPostRequest(BaseModel):
    topic: str
    iterations: int = 1
    max_iterations: int = 5

@app.post("/generate_job_post")
def generate_job_post(request: JobPostRequest):
    graph = JobPostGraph()
    workflow = graph.build_graph()

    initial_state = {
        "topic": request.topic,
        "content": "",
        "evaluation": "needs_improvements",
        "feedback": "",
        "iterations": request.iterations,
        "max_iterations": request.max_iterations,
        "content_history": [],
        "feedback_history": [],
    }

    final_state = workflow.invoke(initial_state)  # type: ignore
    return final_state  # return as JSON automatically
