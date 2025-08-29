from typing import TypedDict, Literal
from typing_extensions import Annotated
import operator

class JobPostState(TypedDict):
    topic: str
    content: str
    evaluation: Literal['approved', 'needs_improvements']
    feedback: str
    iterations: int
    max_iterations: int

    content_history: Annotated[list[str],operator.add]
    feedback_history: Annotated[list[str],operator.add]