from pydantic import BaseModel,Field
from typing import Literal

class JobEvaluationSchema(BaseModel):
    evaluation: Literal['approved', 'needs_improvements']= Field(description="The evaluation result, either 'approved' or 'needs_improvements'")
    feedback: str = Field(description="Constructive feedback highlighting strengths and areas for improvement")