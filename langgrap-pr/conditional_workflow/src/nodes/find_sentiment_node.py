from src.state.ReviewState import ReviewState
from src.llm.LLMGroq import LLMGroq
from src.schema.SentimentSchema import SentimentShema

def find_sentiment(sate: ReviewState):
    prompt=f"Classify the sentiment of the following review as either 'positive' or 'negative':\n\n{sate['review']}\n\n"
    llm = LLMGroq(schema=SentimentShema)
    response=llm.model.invoke(prompt).sentiment #type: ignore
    return {'sentiment':response}
