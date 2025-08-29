import uvicorn

def main():
    print("🚀 Starting Job Post Generator API on http://127.0.0.1:8000 ...")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)

if __name__ == "__main__":
    main()
