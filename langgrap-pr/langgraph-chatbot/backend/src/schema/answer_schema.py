from pydantic import BaseModel

class ChatAnswer(BaseModel):
    answer: str  # Explanation in Markdown (headings, bullets, etc.)
    code: str = ""  # Optional code block, empty string if none
