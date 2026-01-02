from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from schemas.assessment import StartAssessmentRequest, SubmitResponseRequest, AssessmentResponse, AssessmentHistoryResponse
from services.assessment_service import assessment_service
from services.audio_utils import generate_tts, transcribe_audio
from utils.security import get_current_user_id
import tempfile
import os

router = APIRouter(prefix="/assessment", tags=["Assessment"])

@router.post("/start", response_model=AssessmentResponse)
async def start_assessment(request: StartAssessmentRequest, user_id: str = Depends(get_current_user_id)):
    """Start a new adaptive assessment session."""
    session = await assessment_service.start_session(user_id, request.context)
    
    # Generate initial question
    first_question = await assessment_service.generate_next_question(session)
    
    # Generate Audio for specific question
    audio_url = await generate_tts(first_question, "en-US-AriaNeural")
    
    return AssessmentResponse(
        session_id=str(session.id),
        next_question=first_question,
        progress=0,
        should_stop=False,
        audio_url=audio_url
    )

@router.post("/response", response_model=AssessmentResponse)
async def submit_response(request: SubmitResponseRequest, user_id: str = Depends(get_current_user_id)):
    """Submit a response and get the next question or feedback."""
    try:
        result = await assessment_service.submit_response(request.session_id, request.response_text)
        
        # Determine text to speak (Feedback if stopping, or Next Question)
        text_to_speak = result.get("feedback") if result.get("should_stop") else result.get("next_question")
        
        if text_to_speak:
            audio_url = await generate_tts(text_to_speak, "en-US-AriaNeural")
            result["audio_url"] = audio_url
            
        return AssessmentResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/talk", response_model=AssessmentResponse)
async def submit_voice_response(
    file: UploadFile = File(...),
    session_id: str = Form(...),
    user_id: str = Depends(get_current_user_id)
):
    """Submit a voice response, transcribe it, and get next question with audio."""
    try:
        # Save audio file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            content = await file.read()
            temp_audio.write(content)
            temp_audio_path = temp_audio.name
        
        # 1. Transcribe
        try:
            user_text = await transcribe_audio(temp_audio_path)
            print(f"Assessment Transcribed: {user_text}")
        finally:
            os.unlink(temp_audio_path)

        if not user_text.strip():
             raise HTTPException(status_code=400, detail="No speech detected")

        # 2. Process via Assessment Service
        result = await assessment_service.submit_response(session_id, user_text)
        
        # 3. Generate Audio for Next Question / Feedback
        text_to_speak = result.get("feedback") if result.get("should_stop") else result.get("next_question")
        
        if text_to_speak:
            audio_url = await generate_tts(text_to_speak, "en-US-AriaNeural")
            result["audio_url"] = audio_url
            
        return AssessmentResponse(**result)
        
    except Exception as e:
        print(f"Assessment Voice Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history", response_model=AssessmentHistoryResponse)
async def get_history(user_id: str = Depends(get_current_user_id)):
    # TODO: Implement full history retrieval
    return AssessmentHistoryResponse(sessions=[])
