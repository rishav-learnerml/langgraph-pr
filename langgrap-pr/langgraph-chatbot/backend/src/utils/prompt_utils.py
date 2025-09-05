# src/utils/prompt_utils.py
def escape_for_prompt(text: str) -> str:
    """
    Escape braces so LangChain/ChatPromptTemplate does not attempt to expand
    JSON or other braces as template variables.
    """
    if not isinstance(text, str):
        text = str(text)
    # Double braces escape them in prompt templating
    return text.replace("{", "{{").replace("}", "}}")
