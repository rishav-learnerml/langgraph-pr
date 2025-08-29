from typing import Literal
from pydantic import Field,BaseModel

class DiagnosysSchema(BaseModel):
    issue_type: Literal['UX', 'Performance', 'Bug', "Support", "Other"]=Field(description="The type of issue identified in the calm")
    tone: Literal['angry', 'disappointed', 'frustrated', 'neutral']=Field(description="The tone of the review")
    urgency: Literal['high', 'medium', 'low']=Field(description="The urgency or criticality of the issue")