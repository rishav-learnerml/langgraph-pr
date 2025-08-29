from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os

load_dotenv()

class LLMLlama:
    def __init__(self, schema=None):
        self.model = ChatGroq(model="llama-3.1-8b-instant", api_key=os.getenv("GROQ_API_KEY"))  # type: ignore
        if schema is not None:
            self.model = self.model.with_structured_output(schema)