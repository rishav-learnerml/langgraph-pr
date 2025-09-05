from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os

load_dotenv()

class LLMGroq:
    def __init__(self, tools=None) -> None:
        """Light wrapper around ChatGroq that (optionally) binds tools.
        IMPORTANT: .bind_tools returns a NEW runnable - it does NOT mutate in-place.
        """
        self.model = ChatGroq(
            model_name="llama-3.3-70b-versatile",
            groq_api_key=os.getenv("GROQ_API_KEY"),  # type: ignore
            streaming=True,
        )
        if tools:
            # Reassign to the bound runnable so tool calls actually work
            self.model = self.model.bind_tools(tools=tools)
