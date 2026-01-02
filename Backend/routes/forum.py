from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List
from schemas.forum import PostCreate, PostResponse, ReplyCreate, Reply
from services.forum_service import create_post, get_all_posts, add_reply, like_post
from utils.security import get_current_user_id

router = APIRouter(prefix="/forum", tags=["Forum"])

@router.get("/posts", response_model=List[PostResponse])
async def list_posts(user_id: str = Depends(get_current_user_id)):
    return await get_all_posts()

@router.post("/posts", response_model=PostResponse)
async def create_new_post(post: PostCreate, user_id: str = Depends(get_current_user_id)):
    return await create_post(user_id, post.content, post.color)

@router.post("/posts/{post_id}/reply", response_model=Reply)
async def reply_to_post(post_id: str, reply: ReplyCreate, user_id: str = Depends(get_current_user_id)):
    result = await add_reply(post_id, user_id, reply.content)
    if not result:
        raise HTTPException(status_code=404, detail="Post not found")
    return result

@router.post("/posts/{post_id}/like")
async def like_a_post(post_id: str, user_id: str = Depends(get_current_user_id)):
    result = await like_post(post_id, user_id)
    if result["status"] == "not_found":
        raise HTTPException(status_code=404, detail="Post not found")
    return result
