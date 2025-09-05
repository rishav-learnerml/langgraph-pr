# app/services/summarizer.py
from typing import List, Dict
from langchain_core.prompts import ChatPromptTemplate
from src.llm.lllm_groq import LLMGroq
from src.utils.prompt_utils import escape_for_prompt  # <- new helper

_SUMMARY_SYSTEM = (
    "You are a helpful assistant that writes crisp, lossless summaries of chats. "
    "Keep specific facts, entities, decisions, and action items. Be under 200–300 words."
)

async def summarize_messages(older_msgs: List[Dict[str, str]]) -> str:
    if not older_msgs:
        return ""

    transcript = []
    for m in older_msgs:
        role = m.get("role", "")
        content = m.get("content", "")
        if role in ("human", "ai"):
            transcript.append(f"{role.upper()}: {content}")
    transcript_text = "\n".join(transcript)

    # Escape braces in transcript so ChatPromptTemplate won't interpret embedded JSON
    safe_transcript = escape_for_prompt(transcript_text)

    try:
        prompt = ChatPromptTemplate.from_messages([
            ("system", _SUMMARY_SYSTEM),
            ("user", f"Summarize the following chat history:\n\n{safe_transcript}")
        ])
        chain = prompt | LLMGroq().model
        out = await chain.ainvoke({})
        return (out.content or "").strip()  # type: ignore
    except Exception as e:
        print(f"[summarize_messages][ERROR] summarization failed: {e}")
        # As a fallback, return a short manual summary or empty string
        return ""
