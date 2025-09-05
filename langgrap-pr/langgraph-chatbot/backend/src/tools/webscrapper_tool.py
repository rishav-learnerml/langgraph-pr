from langchain_core.tools import tool
import requests
from bs4 import BeautifulSoup

@tool
def webscrapper_tool(url: str) -> dict:
    """Fetches and returns the main content from a given webpage URL.
    Args:
        url (str): The URL of the webpage to scrape.
    Returns:
        dict: A dictionary containing the URL and the extracted content or an error message.
    """
    try:
        headers = {"User-Agent": "HashTalkBot/1.0 (+https://your.domain/)"}
        response = requests.get(url, timeout=10, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        paragraphs = soup.find_all("p")
        content = "\n".join(p.get_text() for p in paragraphs).strip()
        if not content:
            # fallback to text snippet
            return {"url": url, "content": soup.get_text()[:2000]}
        return {"url": url, "content": content}
    except requests.exceptions.RequestException as e:
        return {"error": f"Request failed: {str(e)}"}
    except Exception as e:
        return {"error": str(e)}
