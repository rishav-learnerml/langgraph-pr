# src/utils/query_utils.py
import re
from typing import Dict, List, Tuple, Any, Optional


def analyze_tools(user_query: str) -> Dict[str, Any]:
    """
    Heuristic analysis of which tools are likely needed to answer `user_query`.

    Returns a dict:
      {
        "tools": ["duckduckgo_search_tool", "calculator", ...],
        "reasons": {"duckduckgo_search_tool": "contains 'current' or 'price'", ...},
        "confidence": {"duckduckgo_search_tool": 0.9, ...}
      }
    """
    q = (user_query or "").strip()
    ql = q.lower()

    tools: List[str] = []
    reasons: Dict[str, str] = {}
    confidence: Dict[str, float] = {}

    # 0) If query clearly requests code/examples -> no external tools
    code_indicators = [
        r"\bpython\b",
        r"\bjavascript\b",
        r"\bnode\b",
        r"\bfunction\b",
        r"\bclass\b",
        r"\bscript\b",
        r"\bimplement\b",
        r"\bexample\b",
        r"```",
    ]
    if any(re.search(p, ql) for p in code_indicators):
        return {"tools": [], "reasons": {}, "confidence": {}}

    # 1) URL / domain -> webscrapper
    if re.search(r"https?://|www\.\w+\.", ql) or "url:" in ql:
        tools.append("webscrapper_tool")
        reasons["webscrapper_tool"] = "contains a URL or domain"
        confidence["webscrapper_tool"] = 0.95

    # 2) Factual/current queries -> web search
    web_indicators = (
        r"\b(current|latest|today|now|recent|price|quote|stock|news|who is|what is the population|"
        r"election|president|prime minister|weather)\b"
    )
    if re.search(web_indicators, ql):
        tools.append("duckduckgo_search_tool")
        reasons["duckduckgo_search_tool"] = "looks like a factual/current web query"
        confidence["duckduckgo_search_tool"] = 0.85

    # 3) Explicit "find", "search", "lookup"
    if re.search(r"\b(find|search|lookup|where is|homepage)\b", ql) and "duckduckgo_search_tool" not in tools:
        tools.append("duckduckgo_search_tool")
        reasons["duckduckgo_search_tool"] = (
            reasons.get("duckduckgo_search_tool", "") + " / user asked to find/search"
        )
        confidence["duckduckgo_search_tool"] = max(confidence.get("duckduckgo_search_tool", 0.0), 0.7)

    # 4) Math expressions or numeric operations -> calculator
    if re.search(r"[-+]?\d+(\.\d+)?\s*[\+\-\*/]\s*[-+]?\d+(\.\d+)?", q):
        tools.append("calculator")
        reasons["calculator"] = "contains explicit arithmetic expression"
        confidence["calculator"] = 0.98

    # Detect purchase/cost/total language with numbers -> calculator (and possibly web search)
    if re.search(r"\b(buy|cost|total|how much|price of|pay for|spend|amount|shares)\b", ql):
        if re.search(r"\d", q):
            if "calculator" not in tools:
                tools.append("calculator")
            reasons["calculator"] = reasons.get("calculator", "") + " / asks about cost or totals with numbers"
            confidence["calculator"] = max(confidence.get("calculator", 0.0), 0.9)
        else:
            if "duckduckgo_search_tool" not in tools:
                tools.append("duckduckgo_search_tool")
                reasons["duckduckgo_search_tool"] = reasons.get("duckduckgo_search_tool", "") + " / needs current pricing"
                confidence["duckduckgo_search_tool"] = max(confidence.get("duckduckgo_search_tool", 0.0), 0.8)

    # 5) Stock/company detection heuristics -> web search
    if re.search(r"\b[A-Z]{1,5}\b", user_query) and re.search(r"\bstock\b|\bshare(s)?\b|\bticker\b", ql):
        if "duckduckgo_search_tool" not in tools:
            tools.append("duckduckgo_search_tool")
            reasons["duckduckgo_search_tool"] = reasons.get("duckduckgo_search_tool", "") + " / stock/ticker query"
            confidence["duckduckgo_search_tool"] = max(confidence.get("duckduckgo_search_tool", 0.0), 0.9)

    if re.search(r"\bapple stock\b|\baapl\b", ql):
        if "duckduckgo_search_tool" not in tools:
            tools.append("duckduckgo_search_tool")
            reasons["duckduckgo_search_tool"] = reasons.get("duckduckgo_search_tool", "") + " / company stock query"
            confidence["duckduckgo_search_tool"] = max(confidence.get("duckduckgo_search_tool", 0.0), 0.9)

    return {"tools": tools, "reasons": reasons, "confidence": confidence}


def modify_user_query(thread_id: str, user_query: str) -> str:
    """
    Backwards-compatible query modifier.

    - Returns a normalized or clarified query string (keeps same signature you had).
    - Uses analyze_tools() heuristics to decide whether minimal enrichment (e.g., add
      'current' for price queries) or a clarification prompt is appropriate.
    """
    _, decision = modify_user_query_with_decision(thread_id, user_query)
    return decision["modified_query"]


def modify_user_query_with_decision(thread_id: str, user_query: str) -> Tuple[str, Dict[str, Any]]:
    """
    Enhanced modifier that returns both the modified query and the tool decision metadata.

    Returns:
      (thread_id, {
         "modified_query": str,
         "tools": [...],
         "reasons": {...},
         "confidence": {...},
         "clarify": bool,
         "clarification_prompt": Optional[str]
      })
    """
    # Guard: ensure thread_id string to preserve contract
    if thread_id is None:
        thread_id = ""

    if not user_query or not user_query.strip():
        result = {
            "modified_query": "Could you tell me what you'd like help with?",
            "tools": [],
            "reasons": {},
            "confidence": {},
            "clarify": True,
            "clarification_prompt": "Please provide a short description of what you want help with.",
        }
        return thread_id, result

    q = user_query.strip()
    words = q.split()
    ql = q.lower()

    # Basic normalization: strip surrounding quotes/backticks and collapse whitespace
    q = re.sub(r"^\s*[`'\"]+|[`'\"]+\s*$", "", q).strip()
    q = re.sub(r"\s+", " ", q)

    # If user explicitly asks for code/examples -> do not propose tools
    code_keywords = ("python", "javascript", "js", "function", "example", "implement", "class", "script", "snippet")
    if any(k in ql for k in code_keywords):
        result = {
            "modified_query": q,
            "tools": [],
            "reasons": {},
            "confidence": {},
            "clarify": False,
            "clarification_prompt": None,
        }
        return thread_id, result

    analysis = analyze_tools(q)
    tools = analysis.get("tools", [])
    reasons = analysis.get("reasons", {})
    confidence = analysis.get("confidence", {})

    # If very short and no suggested tools -> ask for clarification
    if len(words) < 3 and not tools:
        clarification_prompt = (
            f"I need a bit more detail to help. Could you expand on: '{q}'? "
            "For example: what exactly are you trying to find or compute?"
        )
        result = {
            "modified_query": clarification_prompt,
            "tools": tools,
            "reasons": reasons,
            "confidence": confidence,
            "clarify": True,
            "clarification_prompt": clarification_prompt,
        }
        return thread_id, result

    # If both web search and calculator are needed (e.g. "apple stock price and cost for 23 shares")
    if "duckduckgo_search_tool" in tools and "calculator" in tools:
        if not re.search(r"\b(current|latest|today|now)\b", ql):
            modified_query = "current " + q
        else:
            modified_query = q
        result = {
            "modified_query": modified_query,
            "tools": tools,
            "reasons": reasons,
            "confidence": confidence,
            "clarify": False,
            "clarification_prompt": None,
        }
        return thread_id, result

    # If only calculator is needed (explicit math)
    if tools == ["calculator"] or ("calculator" in tools and len(tools) == 1):
        # sanitize to math expression only
        math_q = re.sub(r"[^\d\.\+\-\*/(),%\s]", "", q)
        math_q = math_q.strip()
        modified_query = math_q or q
        result = {
            "modified_query": modified_query,
            "tools": ["calculator"],
            "reasons": reasons,
            "confidence": confidence,
            "clarify": False,
            "clarification_prompt": None,
        }
        return thread_id, result

    # If only web search needed, prefer to add "current" for price/news queries when sensible
    if "duckduckgo_search_tool" in tools:
        if not re.search(r"\b(current|latest|today|now)\b", ql) and re.search(r"\b(price|stock|quote|news|current|today)\b", ql):
            modified_query = "current " + q
        else:
            modified_query = q
        result = {
            "modified_query": modified_query,
            "tools": tools,
            "reasons": reasons,
            "confidence": confidence,
            "clarify": False,
            "clarification_prompt": None,
        }
        return thread_id, result

    # If webscrapper is suggested (URL passed) — keep as-is
    if "webscrapper_tool" in tools:
        result = {
            "modified_query": q,
            "tools": tools,
            "reasons": reasons,
            "confidence": confidence,
            "clarify": False,
            "clarification_prompt": None,
        }
        return thread_id, result

    # Default: return normalized query with the analysis metadata
    result = {
        "modified_query": q,
        "tools": tools,
        "reasons": reasons,
        "confidence": confidence,
        "clarify": False,
        "clarification_prompt": None,
    }
    return thread_id, result
