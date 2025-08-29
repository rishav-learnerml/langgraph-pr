from src.state.ReviewState import ReviewState
from src.llm.LLMGroq import LLMGroq

def negetive_response(state:ReviewState):
    prompt=f"""
You are a customer support agent. Craft a professional and empathetic response to the following negative review, addressing the customer's concerns and offering assistance. Apologize for the inconvenience caused and assure them that their feedback is valued. The user had a {state['diagnosis']['issue_type']} issue and the tone of the review is {state['diagnosis']['tone']}. The urgency of the issue is {state['diagnosis']['urgency']}.
"""
    llm=LLMGroq()
    response=llm.model.invoke(prompt).content #type: ignore
    return {'response':response}