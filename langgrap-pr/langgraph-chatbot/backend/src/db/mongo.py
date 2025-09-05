from motor.motor_asyncio import AsyncIOMotorClient #type: ignore
from src.core.config import MONGO_URI, DB_NAME, SESSIONS_COLL

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]
sessions_collection = db[SESSIONS_COLL]
