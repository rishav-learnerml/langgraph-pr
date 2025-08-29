from src.graph.SentimentGraph import SentimentGraph
from src.llm.LLMGroq import LLMGroq

def main():
    print("Analysing customer review!")
    graph=SentimentGraph(LLMGroq())
    workflow=graph.build_graph()
    initial_state_posiive={'review':"I absolutely love this product! It has changed my life for the better. The quality is top-notch and the customer service was excellent. I highly recommend it to everyone looking for something reliable and effective."}
    initial_state_negative={'review':"I'm really disappointed with this product. It stopped working after just a week of use, and the customer service was unhelpful when I reached out for support. I expected much better quality for the price I paid."}
    # final_state_positive=workflow.invoke(initial_state_posiive) #type: ignore
    final_state_negative=workflow.invoke(initial_state_negative) #type: ignore
    # print(final_state_positive.response) #type: ignore
    print(final_state_negative)


if __name__ == "__main__":
    main()
