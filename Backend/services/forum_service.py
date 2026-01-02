from datetime import datetime
from bson import ObjectId
from db.database import get_database
from typing import List, Optional

async def create_post(user_id: str, content: str, color: str) -> dict:
    db = get_database()
    post = {
        "user_id": user_id,
        "username": "Anonymous",
        "content": content,
        "color": color,
        "likes": 0,
        "liked_by": [],
        "replies": [],
        "created_at": datetime.utcnow()
    }
    result = await db.posts.insert_one(post)
    post["id"] = str(result.inserted_id)
    return post

async def get_all_posts() -> List[dict]:
    db = get_database()
    cursor = db.posts.find().sort("created_at", -1)
    posts = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        # Format replies
        if "replies" in doc:
            for r in doc["replies"]:
                r["id"] = str(r["id"]) if "id" in r else str(ObjectId())
        posts.append(doc)
    return posts

async def add_reply(post_id: str, user_id: str, content: str) -> Optional[dict]:
    db = get_database()
    reply_id = str(ObjectId())
    reply = {
        "id": reply_id,
        "user_id": user_id,
        "username": "Anonymous",
        "content": content,
        "created_at": datetime.utcnow()
    }
    
    result = await db.posts.update_one(
        {"_id": ObjectId(post_id)},
        {"$push": {"replies": reply}}
    )
    
    if result.modified_count == 0:
        return None
        
    return reply

async def like_post(post_id: str, user_id: str) -> dict:
    db = get_database()
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        return {"status": "not_found", "likes": 0}
        
    liked_by = post.get("liked_by", [])
    
    if user_id in liked_by:
        # User already liked, so unlike
        await db.posts.update_one(
            {"_id": ObjectId(post_id)},
            {"$inc": {"likes": -1}, "$pull": {"liked_by": user_id}}
        )
        return {"status": "unliked", "likes": post.get("likes", 1) - 1}
    else:
        # New like
        await db.posts.update_one(
            {"_id": ObjectId(post_id)},
            {"$inc": {"likes": 1}, "$push": {"liked_by": user_id}}
        )
        return {"status": "liked", "likes": post.get("likes", 0) + 1}
