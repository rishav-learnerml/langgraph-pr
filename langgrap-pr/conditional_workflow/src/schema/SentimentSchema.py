from pydantic import BaseModel, Field
from typing import Literal

class SentimentShema(BaseModel):
    sentiment: Literal['positive', 'negative'] = Field(description="The sentiment of the review")