from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os

load_dotenv()

class LLMGroq:
    def __init__(self) -> None:
        self.model = ChatGroq(
            model_name="gemma2-9b-it",
            groq_api_key=os.getenv("GROQ_API_KEY"), #type:ignore
            streaming=True  # <-- important
        )
