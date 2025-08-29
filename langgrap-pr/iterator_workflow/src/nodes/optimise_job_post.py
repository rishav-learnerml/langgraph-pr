from src.state.job_post_state import JobPostState
from src.llm.llm_llama import LLMLlama

def optimise_job_post(state: JobPostState):
    prompt = f"""
    You are an expert HR content optimizer. Your task is to enhance the following job post to make it more engaging, clear, and appealing to top candidates.

    👉 Current Job Topic: {state['topic']}
    👉 Current Job Post Content: {state['content']}
    👉 Feedback received: {state['feedback']}

    Please improve the job post by focusing on the following aspects:
    1. Enhance clarity and conciseness while retaining all essential information.
    2. Increase engagement by using a professional yet friendly tone.
    3. Ensure the inclusion of relevant emojis and hashtags to make it more appealing.
    4. Strengthen the Call-to-Action (CTA) to inspire potential candidates to apply.
    5. Maintain a human touch to avoid the feel of AI-generated content.

    ✨ Writing Style:
    - Keep it **professional yet friendly**.  
    - Use **emojis** where appropriate to make it engaging.  
    - Add **relevant hashtags** (e.g., #Hiring #JobOpportunity #CareerGrowth).  
    - Ensure it's easy to read, scannable, and appealing to top candidates.  
    - Ensure the job post does not exceed 300 words.
    - Ensure it includes all required sections (Job Title, Company Introduction, Role Overview, Key Responsibilities, Required Qualifications & Skills, Preferred Qualifications, Perks & Benefits, Call-to-Action).
    - Ensure it doesnot sound ai-generated and have human touch.

    *** You need to be very strict and critical while optimising the job post. Even if there is a minor issue, a minor feedback you must improve it. ***

    Return the output as a polished job post, ready to share on LinkedIn or social media.
    """

    #call llama as optimiser
    llm = LLMLlama()
    response = llm.model.invoke(prompt).content # type: ignore
    current_iterations = state.get('iterations', 0)  # type: ignore
    return {'content': response,'iterations': current_iterations + 1, 'content_history':[response]}  # type: ignore
