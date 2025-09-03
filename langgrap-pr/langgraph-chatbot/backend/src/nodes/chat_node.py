from src.state.chat_state import ChatState
from src.llm.lllm_groq import LLMGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

async def chat_node(state: ChatState):
    # Refined system prompt with strict fenced block rule
    system_prompt = SystemMessage(
    content=(
        "You are a highly knowledgeable AI assistant. "
        "When providing code, you MUST always:\n"
        "1. Use fenced Markdown blocks with the language tag.\n"
        "2. Place a newline after the opening ```python and before the closing ```.\n"
        "3. Write multi-line code with correct indentation.\n\n"
        "Correct:\n"
        "```python\n"
        "def multiply_nums(num1, num2):\n"
        "    \"\"\"Multiplies two numbers together.\"\"\"\n"
        "    return num1 * num2\n"
        "```\n\n"
        "Incorrect:\n"
        "```python def multiply_nums(num1, num2): return num1 * num2 ```"
        )
    )


    # Few-shot examples
    few_shots = [
        HumanMessage(content="python function to add two numbers"),
        AIMessage(
            content=(
                "```python\n"
                "def add_two_nums(num1, num2):\n"
                "    \"\"\"Adds two numbers together.\"\"\"\n"
                "    return num1 + num2\n"
                "```\n\n"
                "### Explanation\n"
                "- Defines a function `add_two_nums`.\n"
                "- Takes two parameters: `num1` and `num2`.\n"
                "- Returns their sum with `return num1 + num2`.\n\n"
                "### Example Usage\n"
                "```python\n"
                "print(add_two_nums(3, 5))   # Output: 8\n"
                "print(add_two_nums(-2, 10)) # Output: 8\n"
                "```\n\n"
                "### Key Notes\n"
                "- Works with integers and floats.\n"
                "- Raises `TypeError` if non-numeric values are passed."
            )
        ),
        HumanMessage(content="javascript function to check if a number is even"),
        AIMessage(
            content=(
                "```javascript\n"
                "function isEven(num) {\n"
                "  return num % 2 === 0;\n"
                "}\n"
                "```\n\n"
                "### Explanation\n"
                "- Defines a function `isEven`.\n"
                "- Uses the modulo operator `%` to check remainder when dividing by 2.\n"
                "- Returns `true` if divisible by 2, otherwise `false`.\n\n"
                "### Example Usage\n"
                "```javascript\n"
                "console.log(isEven(4));  // true\n"
                "console.log(isEven(7));  // false\n"
                "```\n\n"
                "### Key Notes\n"
                "- Works with positive and negative integers.\n"
                "- Non-numeric input will return `false` or throw an error depending on environment."
            )
        )
    ]

    # Prepend system + few-shots to conversation
    messages = [system_prompt] + few_shots + state["messages"]

    llm = LLMGroq().model

    # Stream response
    async for chunk in llm.astream(messages):
        if chunk.content:  # type: ignore
            yield {"messages": [chunk]}
