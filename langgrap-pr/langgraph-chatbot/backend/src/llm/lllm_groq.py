from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os
from typing import Optional, Type
from pydantic import BaseModel

load_dotenv()

class LLMGroq:
    def __init__(self, schema: Optional[Type[BaseModel]] = None) -> None:
        """Initialize Groq model.
        
        Args:
            schema: Optional Pydantic schema class. If provided, model will return structured outputs.
        """
        base_model = ChatGroq(
            model_name="gemma2-9b-it",
            groq_api_key=os.getenv("GROQ_API_KEY"),  # type: ignore
            streaming=True
        )

        # If schema is provided → wrap with structured output
        if schema:
            self.model = base_model.with_structured_output(schema)
        else:
            self.model = base_model
