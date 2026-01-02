from fastapi import APIRouter, Depends, HTTPException
from typing import List
from schemas.chat import ChatHistoryResponse, ChatMessageResponse
from services.chat_service import get_chat_history, clear_chat_history
from utils.security import get_current_user_id

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.get("/history", response_model=ChatHistoryResponse)
async def get_history(session_id: str = "default", user_id: str = Depends(get_current_user_id)):
    messages = await get_chat_history(user_id, session_id)
    return ChatHistoryResponse(
        messages=[
            ChatMessageResponse(
                id=str(msg.id),
                role=msg.role,
                content=msg.content,
                timestamp=msg.timestamp
            ) for msg in messages
        ]
    )

@router.delete("/history")
async def delete_history(session_id: str = "default", user_id: str = Depends(get_current_user_id)):
    await clear_chat_history(user_id, session_id)
    return {"message": "Chat history cleared"}
