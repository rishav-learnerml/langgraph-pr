from src.state.job_post_state import JobPostState
from src.llm.llm_openai import LLMOpenAI

def generate_job_post(state: JobPostState):
    prompt = f"""
    You are an expert HR content creator. Your task is to create a **detailed and engaging job post** for the following role/topic:

    👉 Job Topic: {state['topic']}

    The job post must include the following sections:
    1. **Job Title** – clear, attractive, and precise.  
    2. **Company Introduction** – a short but appealing overview of the company, highlighting values, culture, or achievements.  
    3. **Role Overview** – 2–3 lines summarizing what makes the role exciting and important.  
    4. **Key Responsibilities** – use bullet points to outline the main tasks.  
    5. **Required Qualifications & Skills** – mention technical skills, soft skills, and any certifications if applicable.  
    6. **Preferred Qualifications** (if any) – highlight “nice-to-have” skills.  
    7. **Perks & Benefits** – mention salary (if known), growth opportunities, work culture, flexibility, or other employee benefits.  
    8. **Call-to-Action (CTA)** – end with an inspiring invitation to apply.

    ✨ Writing Style:
    - Make it **professional yet friendly**.  
    - Use **emojis** where appropriate to make it engaging.  
    - Add **relevant hashtags** (e.g., #Hiring #JobOpportunity #CareerGrowth).  
    - Ensure it’s easy to read, scannable, and appealing to top candidates.  

    Return the output as a polished job post, ready to share on LinkedIn or social media.
    """

    #call openai as genrator
    llm = LLMOpenAI()
    response = llm.model.invoke(prompt).content # type: ignore
    return {'content': response, 'content_history':[response]}  # type: ignore

