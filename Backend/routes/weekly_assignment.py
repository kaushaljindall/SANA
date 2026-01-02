from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from utils.security import get_current_user_id
from services import weekly_service
from services.audio_utils import transcribe_audio, generate_tts
import tempfile
import os

router = APIRouter(prefix="/assignments", tags=["Weekly Assignments"])

@router.get("/check")
async def check_due(user_id: str = Depends(get_current_user_id)):
    is_due = await weekly_service.check_weekly_due(user_id)
    return {"due": is_due}

@router.post("/start")
async def start_session(user_id: str = Depends(get_current_user_id)):
    session = await weekly_service.start_weekly_session(user_id)
    
    # Get first question
    first_q = weekly_service.WEEKLY_QUESTIONS[session.current_question_index]["text"]
    
    # Generate TTS for first question
    audio_url = await generate_tts(first_q)
    
    return {
        "session_id": str(session.id),
        "text": first_q,
        "audio_url": audio_url,
        "progress": 0
    }

@router.post("/response")
async def submit_response(
    file: UploadFile = File(...),
    sessionId: str = Form(...),
    user_id: str = Depends(get_current_user_id)
):
    try:
        # 1. Transcribe
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp:
            temp.write(await file.read())
            temp_path = temp.name
            
        user_text = await transcribe_audio(temp_path)
        os.unlink(temp_path)
        
        # 2. Process
        result = await weekly_service.process_response(sessionId, user_text)
        
        # 3. Generate TTS for response
        audio_url = await generate_tts(result["text"])
        
        return {
            "status": result["status"],
            "text": result["text"],
            "next_question": result["next_question"],
            "audio_url": audio_url,
            "progress": result["progress"]
        }
        
    except Exception as e:
        print(f"Assignment Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
