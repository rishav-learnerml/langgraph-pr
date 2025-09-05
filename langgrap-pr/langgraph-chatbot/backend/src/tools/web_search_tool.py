from langchain_community.tools import DuckDuckGoSearchRun
from langchain_core.tools import tool

@tool
def duckduckgo_search_tool(query: str) -> dict:
    """Searches the web using DuckDuckGo and returns results for the given query."""
    try:
        search_tool = DuckDuckGoSearchRun()
        result = search_tool.run(query)
        # ensure string / serializable output
        print(f"duckduckgo_search_tool: query='{query}' result='{result}'")
        return {"query": query, "result": str(result)}
    except Exception as e:
        return {"error": str(e)}
