# src/tools/calculator_tool.py
from typing import Literal
from langchain_core.tools import tool

@tool("calculator", return_direct=False)
def calculator_tool(
    first_num: float,
    second_num: float,
    operation: Literal["add", "subtract", "multiply", "divide"],
) -> dict:
    """Performs basic arithmetic on two numbers."""
    try:
        if operation == "add":
            result = first_num + second_num
        elif operation == "subtract":
            result = first_num - second_num
        elif operation == "multiply":
            result = first_num * second_num
        elif operation == "divide":
            if second_num == 0:
                return {"error": "Division by zero is not allowed."}
            result = first_num / second_num
        else:
            return {"error": f"Unsupported operation '{operation}'."}
        return {
            "first_num": first_num,
            "second_num": second_num,
            "operation": operation,
            ##Round off to 2 decimal places
            "result": round(result, 2),
        }
    except Exception as e:
        return {"error": str(e)}
