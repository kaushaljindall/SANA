from datetime import datetime
from typing import List, Optional
from models.weekly_assignment import WeeklySession, WeeklyResponseItem
from db.database import db
from bson import ObjectId

# Hardcoded weekly questions for MVP
WEEKLY_QUESTIONS = [
    {"id": "q1", "text": "How have your sleep patterns been this past week?", "type": "open"},
    {"id": "q2", "text": "Have you felt overwhelmed by any specific events recently?", "type": "open"},
    {"id": "q3", "text": "On a scale of 1 to 10, how would you rate your overall energy levels?", "type": "scale"},
]

async def check_weekly_due(user_id: str) -> bool:
    # Check if a completed session exists for the current ISO week
    current_week = datetime.now().strftime("%Y-W%U")
    existing = await db.db.weekly_sessions.find_one({
        "user_id": user_id,
        "week_id": current_week,
        "status": "completed"
    })
    return existing is None

async def start_weekly_session(user_id: str) -> WeeklySession:
    current_week = datetime.now().strftime("%Y-W%U")
    
    # Check for in-progress session
    existing = await db.db.weekly_sessions.find_one({
        "user_id": user_id,
        "week_id": current_week,
        "status": "in_progress"
    })
    
    if existing:
        return WeeklySession(**existing)
    
    # Create new
    session = WeeklySession(
        user_id=user_id,
        week_id=current_week,
        status="in_progress",
        current_question_index=0
    )
    result = await db.db.weekly_sessions.insert_one(session.model_dump(by_alias=True, exclude=["id"]))
    session.id = str(result.inserted_id)
    return session

async def process_response(session_id: str, user_text: str) -> dict:
    session_data = await db.db.weekly_sessions.find_one({"_id": ObjectId(session_id)})
    if not session_data:
        raise ValueError("Session not found")
        
    session = WeeklySession(**session_data)
    
    # Get current question
    if session.current_question_index >= len(WEEKLY_QUESTIONS):
        return {"status": "completed", "text": "You've already completed this week's check-in."}
        
    current_q = WEEKLY_QUESTIONS[session.current_question_index]
    
    # --- LOGIC: Validate & Score (Simplified) ---
    # In a real app, we'd use LLM here to validate "Is this a valid answer?"
    # For now, we assume valid if length > 2 chars
    
    response_item = WeeklyResponseItem(
        question_id=current_q["id"],
        question_text=current_q["text"],
        user_audio_text=user_text,
        validation_status="valid",
        internal_score=0.5 # Placeholder score
    )
    
    session.responses.append(response_item)
    session.current_question_index += 1
    
    # Check completion
    is_complete = session.current_question_index >= len(WEEKLY_QUESTIONS)
    if is_complete:
        session.status = "completed"
        session.completed_at = datetime.utcnow()
        response_text = "Thank you. That completes your weekly check-in. I've updated your profile."
        next_q = None
    else:
        next_q = WEEKLY_QUESTIONS[session.current_question_index]["text"]
        response_text = "Got it. " + next_q # Simple acknowledgement + next Q
        
    # Save update
    # Save update
    update_data = session.model_dump(by_alias=True)
    if "_id" in update_data:
        del update_data["_id"]
        
    await db.db.weekly_sessions.replace_one(
        {"_id": ObjectId(session_id)}, 
        update_data
    )
    
    return {
        "status": session.status,
        "text": response_text, # What SANA speaks
        "next_question": next_q,
        "progress": (session.current_question_index / len(WEEKLY_QUESTIONS)) * 100
    }
