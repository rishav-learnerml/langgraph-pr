from typing import Literal
from src.state.ReviewState import ReviewState

def check_sentiment(state:ReviewState)->Literal['positive_response', 'run_diagnosis']:
    if state['sentiment']=='positive':
        return 'positive_response'
    else:
        return 'run_diagnosis'
    