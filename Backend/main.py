from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import uvicorn
from dotenv import load_dotenv
import warnings

# Suppress warnings
warnings.filterwarnings("ignore", category=FutureWarning)

from groq import Groq
import json
import base64
from typing import Optional, List, Dict
import io
import edge_tts
import whisper
import tempfile
import time
import asyncio


# Load Environment Variables
load_dotenv()

app = FastAPI()

# Import auth router
from auth import router as auth_router

# Include authentication routes
app.include_router(auth_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    print("Warning: GROQ_API_KEY not found in .env file")

# Groq Setup
groq_client = Groq(api_key=GROQ_API_KEY)

# Chat History Storage (In-Memory)
chat_sessions: Dict[str, List[dict]] = {}

# Constants
VALID_EXPRESSIONS = ['default', 'smile', 'sad', 'surprised', 'angry', 'crazy']
VALID_ANIMATIONS = ['Angry', 'Arguing', 'BlowKiss', 'Clapping', 'Excited', 'GangamStyleDance', 'Greeting', 'Happy', 'Idle', 'LookAround', 'No', 'SalsaDance', 'SambaDance', 'Talking', 'Thankful', 'Thinking', 'ThoughtfulHeadNod', 'ThoughtfulHeadShake']

SYSTEM_INSTRUCTION = f"""
You are SANA, a compassionate AI mental health companion. You speak warmly and naturally, like a caring friend.

Core behavior:
- Be empathetic and non-judgmental
- Use casual, natural language
- Ask thoughtful follow-up questions
- Validate feelings
- Offer gentle support without giving medical advice
- Keep responses concise but meaningful (2-3 sentences max)

Facial expressions: {", ".join(VALID_EXPRESSIONS)}
Animations: {", ".join(VALID_ANIMATIONS)}

You MUST respond in JSON format:
{{
  "text": "your response here",
  "facialExpression": "choose from valid expressions",
  "animation": "choose from valid animations"
}}
"""

class ChatRequest(BaseModel):
    message: str
    voiceId: Optional[str] = "en-US-JennyNeural"
    ttsModel: Optional[str] = None
    sessionId: Optional[str] = 'default'

class ClearHistoryRequest(BaseModel):
    sessionId: str

async def process_with_groq(user_message: str, session_id: str = 'default'):
    if session_id not in chat_sessions:
        chat_sessions[session_id] = []
    
    history = chat_sessions[session_id]
    
    # Build messages for Groq
    messages = [{"role": "system", "content": SYSTEM_INSTRUCTION}]
    
    # Add conversation history
    for turn in history:
        messages.append({"role": turn["role"], "content": turn["content"]})
    
    # Add current user message
    messages.append({"role": "user", "content": user_message})
    
    try:
        print(f"Sending message to Groq (llama-3.3-70b)...")
        
        # Call Groq API with JSON mode
        completion = await asyncio.to_thread(
            groq_client.chat.completions.create,
            model="llama-3.3-70b-versatile",  # Fast, high-quality model
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=300
        )
        
        print("✅ Groq response received.")
        
        # Parse response
        response_text = completion.choices[0].message.content
        print(f"Raw Response: {response_text}")
        
        response_json = json.loads(response_text)
        
        # Validate response structure
        if "text" not in response_json:
            raise ValueError("Missing 'text' in response")
        
        # Ensure valid expressions and animations
        if "facialExpression" not in response_json or response_json["facialExpression"] not in VALID_EXPRESSIONS:
            response_json["facialExpression"] = "default"
        
        if "animation" not in response_json or response_json["animation"] not in VALID_ANIMATIONS:
            response_json["animation"] = "Talking"
        
        # Save to history
        history.append({"role": "user", "content": user_message})
        history.append({"role": "assistant", "content": response_json["text"]})
        
        # Keep last 10 turns (20 messages)
        if len(history) > 20:
            history = history[-20:]
        chat_sessions[session_id] = history
        
        return response_json
    
    except json.JSONDecodeError as e:
        print(f"❌ JSON Parsing Error: {e}")
        return {
            "text": "I'm having trouble forming my thoughts right now. Could you rephrase that?",
            "facialExpression": "default",
            "animation": "Thinking"
        }
    
    except Exception as e:
        print(f"❌ Groq Error: {e}")
        return {
            "text": "I'm having trouble connecting right now. Please try again in a moment.",
            "facialExpression": "sad",
            "animation": "Idle"
        }

# Whisper model (lazy loaded)
whisper_model = None

def get_whisper_model():
    global whisper_model
    if whisper_model is None:
        print("Loading Whisper model (base)...")
        whisper_model = whisper.load_model("base")
        print("✅ Whisper model loaded.")
    return whisper_model

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        response_data = await process_with_groq(request.message, request.sessionId)
        return {
            "text": response_data["text"],
            "facialExpression": response_data["facialExpression"],
            "animation": response_data["animation"],
            "audio": None
        }
    except Exception as e:
        print(f"Chat endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/talk")
async def talk(
    file: UploadFile = File(...),
    sessionId: str = Form('default'),
    voiceId: str = Form('en-US-JennyNeural')
):
    try:
        # Save audio file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            content = await file.read()
            temp_audio.write(content)
            temp_audio_path = temp_audio.name
        
        # Speech-to-text with Whisper
        model = get_whisper_model()
        result = model.transcribe(temp_audio_path)
        user_text = result["text"]
        print(f"Transcribed: {user_text}")
        
        # Clean up temp file
        os.unlink(temp_audio_path)
        
        # Get LLM response
        response_data = await process_with_groq(user_text, sessionId)
        
        # Generate TTS
        tts_output = io.BytesIO()
        communicate = edge_tts.Communicate(response_data["text"], voiceId)
        
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                tts_output.write(chunk["data"])
        
        # Convert to base64
        audio_base64 = base64.b64encode(tts_output.getvalue()).decode('utf-8')
        audio_url = f"data:audio/mp3;base64,{audio_base64}"
        
        return {
            "text": response_data["text"],
            "facialExpression": response_data["facialExpression"],
            "animation": response_data["animation"],
            "audio": audio_url
        }
        
    except Exception as e:
        print(f"Talk endpoint error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/clear-history")
async def clear_history(request: ClearHistoryRequest):
    try:
        if request.sessionId in chat_sessions:
            chat_sessions[request.sessionId] = []
            return {"message": f"History cleared for session: {request.sessionId}"}
        else:
            return {"message": f"No history found for session: {request.sessionId}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {
        "message": "SANA Backend - Mental Health AI Companion",
        "llm": "Groq (llama-3.3-70b-versatile)",
        "endpoints": ["/chat", "/talk", "/clear-history"]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3000)
