from fastapi import APIRouter, HTTPException
from src.db.mongo import sessions_collection

router = APIRouter()

@router.get("/chathistory/{thread_id}")
async def chat_history(thread_id: str):
    session = await sessions_collection.find_one({"thread_id": thread_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.get("/sessions")
async def all_sessions():
    cursor = sessions_collection.find({}, {"_id": 0, "thread_id": 1, "title": 1})
    return await cursor.to_list(length=100)
