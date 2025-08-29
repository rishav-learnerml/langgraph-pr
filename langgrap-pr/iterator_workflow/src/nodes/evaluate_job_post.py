from src.state.job_post_state import JobPostState
from src.llm.llm_deepseek import LLMDeepSeek
from src.schema.job_post_schema import JobEvaluationSchema

def evaluate_job_post(state: JobPostState):
    prompt = f"""
    You are an expert HR content evaluator. Your task is to evaluate the following job post based on the given topic.

    👉 Job Post Content: {state['content']}

    Please assess the job post based on the following criteria:
    1. Relevance to the topic
    2. Clarity and conciseness
    3. Engagement and appeal to potential candidates
    4. Inclusion of all required sections (Job Title, Company Introduction, Role Overview, Key Responsibilities, Required Qualifications & Skills, Preferred Qualifications, Perks & Benefits, Call-to-Action)

    Auto-reject if:
    - The job post is off-topic or irrelevant to the specified role.
    - The job post is too vague or lacks essential details.
    - The job post contains grammatical errors or is poorly structured.
    - The job post fails to include key sections as outlined.
    - The job post is not engaging or appealing to potential candidates.
    - The job post exceeds 300 words.
    - The job post lacks a clear call-to-action.
    - The job post does not maintain a professional yet friendly tone.
    - The job post feels like ai-generated and lacks human touch.

    ***Even if there is a minor issue, suggest 'needs_improvements' and provide constructive feedback. You need to be very strict. Even for very very minor improvements auto-reject.***

    ### Respond Only in Structured Format:
    - evaluation: 'approved' or 'needs_improvements'
    - feedback: One paragraph constructive feedback highlighting strengths and areas for improvement.
    """

    #call openai as evaluator
    llm = LLMDeepSeek(schema=JobEvaluationSchema)
    response = llm.model.invoke(prompt) # type: ignore
    return {
        'evaluation': response.evaluation, # type: ignore
        'feedback': response.feedback, # type: ignore
        'feedback_history': [response.feedback]  # type: ignore
    }  # type: ignore