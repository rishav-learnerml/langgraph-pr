# app/services/generate_session_title.py
from langchain_core.prompts import ChatPromptTemplate
from src.db.mongo import sessions_collection
from src.llm.lllm_groq import LLMGroq
from src.utils.prompt_utils import escape_for_prompt  # <- new helper

async def generate_session_title(thread_id: str):
    session = await sessions_collection.find_one({"thread_id": thread_id})
    if not session:
        return

    if session.get("title") != "New Chat":
        return

    messages = session.get("messages", [])
    roles = {m.get("role") for m in messages}
    if not {"human", "ai"}.issubset(roles):
        return

    # Compose a short snippet (first two messages or earliest human+ai)
    convo_text = "\n".join(
        f"{m['role'].capitalize()}: {m['content']}" for m in messages[:2]
    )

    # Escape braces so ChatPromptTemplate won't try to interpret JSON fragments
    safe_convo_text = escape_for_prompt(convo_text)

    try:
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an assistant that creates very short chat titles."),
            ("user", f"Read the conversation below and give a concise 4 or 5 word title.\n\n{safe_convo_text}\nOnly give the title and not any extra word.")
        ])
        chain = prompt | LLMGroq().model
        title = await chain.ainvoke({})
        new_title = title.content.strip('" ')  # type: ignore

        await sessions_collection.update_one(
            {"thread_id": thread_id},
            {"$set": {"title": new_title}}
        )
    except Exception as e:
        # Log and ignore — do not let title generation break the chat flow
        print(f"[generate_session_title][ERROR] Failed to make title: {e}")
        return
