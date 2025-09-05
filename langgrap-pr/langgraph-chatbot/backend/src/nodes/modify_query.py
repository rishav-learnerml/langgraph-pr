# src/nodes/modify_query.py
from typing import Any, Dict, Tuple, Optional
import asyncio

# Import your helper that returns (thread_id, decision_dict)
from src.utils.query_utils import modify_user_query_with_decision

# NOTE: adjust import/type if your ChatState class has a concrete type
# Here we assume state acts like a dict (mapping) and supports get/set.
async def modify_user_query_node(state: Any) -> Any:
    """
    LangGraph node wrapper that normalizes/clarifies the user's query and
    attaches tool-decision metadata to the state.

    Expected behavior:
      - Read thread id from state["thread_id"] or state.configurable.thread_id (robust).
      - Read the incoming user message from one of:
          * state["incoming_query"]
          * last human message in state["messages"] (if present and list-like)
      - Call modify_user_query_with_decision(thread_id, user_query)
      - Store results back into the state under:
          state["normalized_query"] -> str
          state["tool_decision"] -> dict (includes tools, reasons, confidence, clarify, etc.)
      - Return state
    """
    # Defensive extraction of thread_id
    thread_id: Optional[str] = None
    try:
        if isinstance(state, dict):
            thread_id = state.get("thread_id") or (
                state.get("configurable", {}) or {}
            ).get("thread_id")
        else:
            # try attribute-style access
            thread_id = getattr(state, "thread_id", None)
            if thread_id is None:
                cfg = getattr(state, "configurable", None)
                if cfg:
                    thread_id = getattr(cfg, "thread_id", None)
    except Exception:
        thread_id = None

    # Defensive extraction of user query / incoming message
    user_query: Optional[str] = None
    try:
        if isinstance(state, dict):
            # Prefer explicit incoming_query if present
            user_query = state.get("incoming_query")
            if not user_query:
                # Try messages array: last human message
                msgs = state.get("messages") or []
                if isinstance(msgs, list) and msgs:
                    # attempt to find last human
                    for m in reversed(msgs):
                        if isinstance(m, dict) and m.get("role") == "human" and m.get("content"):
                            user_query = m.get("content")
                            break
                        # if messages are plain strings, take last
                    if not user_query and isinstance(msgs[-1], dict) and msgs[-1].get("content"):
                        user_query = msgs[-1].get("content")
                    elif not user_query and isinstance(msgs[-1], str):
                        user_query = msgs[-1]
        else:
            # attribute-style fallback
            user_query = getattr(state, "incoming_query", None)
            if not user_query:
                msgs = getattr(state, "messages", None)
                if isinstance(msgs, list) and msgs:
                    last = msgs[-1]
                    if isinstance(last, dict):
                        user_query = last.get("content") or last.get("text")
                    elif isinstance(last, str):
                        user_query = last
    except Exception:
        user_query = None

    # Final fallback if nothing found
    if not user_query:
        user_query = ""

    # Call the helper (synchronous) - wrap in thread if needed but it's cheap so call directly
    try:
        # modify_user_query_with_decision returns: (thread_id, decision_dict)
        returned_thread, decision = modify_user_query_with_decision(thread_id or "", user_query)
    except Exception as e:
        # On failure, populate a safe fallback decision
        returned_thread = thread_id or ""
        decision = {
            "modified_query": user_query,
            "tools": [],
            "reasons": {},
            "confidence": {},
            "clarify": False,
            "clarification_prompt": None,
        }

    # Write normalized query and tool decision into state in a predictable way
    try:
        if isinstance(state, dict):
            state["normalized_query"] = decision.get("modified_query", user_query)
            state["tool_decision"] = decision
            # Keep original incoming_query if not present
            if "incoming_query" not in state:
                state["incoming_query"] = user_query
            # store thread_id if not present
            if "thread_id" not in state and returned_thread:
                state["thread_id"] = returned_thread
        else:
            # attribute-style set
            try:
                setattr(state, "normalized_query", decision.get("modified_query", user_query))
                setattr(state, "tool_decision", decision)
                if getattr(state, "incoming_query", None) is None:
                    setattr(state, "incoming_query", user_query)
                if getattr(state, "thread_id", None) is None and returned_thread:
                    setattr(state, "thread_id", returned_thread)
            except Exception:
                # Last resort: try dict-like assignment on __dict__
                try:
                    state.__dict__["normalized_query"] = decision.get("modified_query", user_query)
                    state.__dict__["tool_decision"] = decision
                except Exception:
                    pass
    except Exception:
        # swallow to avoid breaking the node execution; state may be partially updated
        pass

    # Return the mutated state for the StateGraph runtime
    return state
