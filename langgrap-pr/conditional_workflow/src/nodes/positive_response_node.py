from src.state.ReviewState import ReviewState
from src.llm.LLMGroq import LLMGroq
from src.schema.SentimentSchema import SentimentShema


def positive_response(state:ReviewState):
    prompt=f"Generate a positive response to the following review:\n\n{state['review']}\n\n Also, ask the user to leave a 5-star review on our website."
    llm = LLMGroq()
    response=llm.model.invoke(prompt).content #type: ignore
    return {'response':response}