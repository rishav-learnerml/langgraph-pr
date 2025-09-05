# app/services/history.py
from typing import List, Dict, Tuple
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from src.db.mongo import sessions_collection
from .summarizer import summarize_messages

SUMMARY_HUMAN_TEXT = "Summary of our conversation so far."

def _split_turns(messages: List[Dict[str, str]]) -> List[List[Dict[str, str]]]:
    turns, buf = [], []
    for m in messages:
        buf.append(m)
        if m.get("role") == "ai":
            turns.append(buf)
            buf = []
    if buf:
        turns.append(buf)
    return turns

def _flatten(turns: List[List[Dict[str, str]]]) -> List[Dict[str, str]]:
    return [m for t in turns for m in t]

def _is_summary_pair(messages: List[Dict[str, str]]) -> bool:
    if len(messages) < 2:
        return False
    human, ai = messages[0], messages[1]
    return (
        human.get("role") == "human"
        and ai.get("role") == "ai"
        and isinstance(human.get("content"), str)
        and human["content"].strip().lower().startswith("summary of our conversation")
    )

async def consolidate_with_summary_pair(thread_id: str, keep_turns: int = 4, threshold_turns: int = 10) -> None:
    """
    If total turns > threshold:
      - compute/merge summary
      - replace older messages with two messages:
          0: human -> SUMMARY_HUMAN_TEXT
          1: ai    -> <summary>
        followed by only the last `keep_turns` turns.
    If summary pair already exists, we *merge* the existing summary with any
    older messages beyond the last `keep_turns` turns (excluding the pair).
    """
    session = await sessions_collection.find_one({"thread_id": thread_id})
    if not session:
        return

    msgs: List[Dict[str, str]] = session.get("messages", [])

    # Remove the leading summary pair (if any) from consideration; we will rebuild it.
    existing_summary_text = ""
    start_idx = 0
    if _is_summary_pair(msgs):
        # The existing summary lives in messages[1]["content"]
        existing_summary_text = msgs[1].get("content", "") or ""
        start_idx = 2

    working = msgs[start_idx:]  # messages after any existing summary pair

    # Compute turns and check threshold on the working set
    turns = _split_turns(working)
    total_turns = len(turns)
    if total_turns <= threshold_turns:
        # Below threshold: nothing to rewrite (but keep existing pair if present)
        return

    # We will keep only the last N turns in tail
    tail_turns = turns[-keep_turns:]
    tail_msgs = _flatten(tail_turns)

    # Everything before tail becomes "older" and must be summarized
    older_turns = turns[:-keep_turns]
    older_msgs = _flatten(older_turns)

    # Merge: if there was an existing summary, include it as the first "older" item to keep it.
    if existing_summary_text.strip():
        older_msgs = [{"role": "ai", "content": existing_summary_text}] + older_msgs

    # Summarize the older part
    summary_text = await summarize_messages(older_msgs)

    # Rebuild final messages: [summary pair] + tail
    new_messages: List[Dict[str, str]] = [
        {"role": "human", "content": SUMMARY_HUMAN_TEXT},
        {"role": "ai", "content": summary_text},
        *tail_msgs,
    ]

    await sessions_collection.update_one(
        {"thread_id": thread_id},
        {"$set": {"messages": new_messages}}
    )

async def build_context_with_summary(session_messages: List[Dict[str, str]], new_user_msg: str) -> Tuple[List[BaseMessage], bool]:
    """
    Always pass the summary pair if present. Then add the rest of messages and the new user message.
    Returns (messages_for_llm, summary_present)
    """
    ctx: List[BaseMessage] = []

    idx = 0
    summary_present = False
    if _is_summary_pair(session_messages):
        # include the pair as-is
        human, ai = session_messages[0], session_messages[1]
        ctx.append(HumanMessage(content=human["content"]))
        ctx.append(AIMessage(content=ai["content"]))
        idx = 2
        summary_present = True

    # Add remaining stored messages
    for m in session_messages[idx:]:
        if m.get("role") == "human":
            ctx.append(HumanMessage(content=m.get("content", "")))
        elif m.get("role") == "ai":
            ctx.append(AIMessage(content=m.get("content", "")))

    # Finally, add the incoming user message
    ctx.append(HumanMessage(content=new_user_msg))
    return ctx, summary_present
