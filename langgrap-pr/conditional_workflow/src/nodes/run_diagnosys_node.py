from src.state.ReviewState import ReviewState
from src.llm.LLMGroq import LLMGroq
from src.schema.diagnosys_schema import DiagnosysSchema

def run_diagnosis(state: ReviewState):
    prompt = f"Analyze the following negative review and provide a detailed diagnosis of the issues mentioned:\n\n{state['review']}\n\n"
    llm = LLMGroq(schema=DiagnosysSchema)
    response = llm.model.invoke(prompt)  # Use structured_model here
    return {'diagnosis': response.model_dump()}  # type: ignore