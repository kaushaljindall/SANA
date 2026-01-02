from models.chat import ChatMessageModel
from db.database import get_database
from typing import List

async def save_message(user_id: str, role: str, content: str, session_id: str = "default"):
    db = get_database()
    
    message = ChatMessageModel(
        user_id=user_id,
        session_id=session_id,
        role=role,
        content=content
    )
    
    await db["chat_history"].insert_one(message.model_dump(by_alias=True, exclude=["id"]))
    return message

async def get_chat_history(user_id: str, session_id: str = "default", limit: int = 50) -> List[ChatMessageModel]:
    db = get_database()
    if db is None:
        print("⚠️ Database not connected. Returning empty history.")
        return []
        
    cursor = db["chat_history"].find(
        {"user_id": user_id, "session_id": session_id}
    ).sort("timestamp", 1).limit(limit)  # 1 for ascending (oldest first)
    
    messages = await cursor.to_list(length=limit)
    return [ChatMessageModel(**msg) for msg in messages]

async def clear_chat_history(user_id: str, session_id: str = "default"):
    db = get_database()
    await db["chat_history"].delete_many({"user_id": user_id, "session_id": session_id})
