from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import uvicorn
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import warnings
import json
import tempfile
import asyncio

# Suppress warnings
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", module="pydantic", message=".*shadows an attribute in parent.*")

# Load Environment Variables
load_dotenv()

# Database & Routes
from db.database import connect_to_mongo, close_mongo_connection
from routes.auth import router as auth_router
from routes.user import router as user_router
from routes.chat import router as chat_router
from routes.report import router as report_router
from routes.doctor import router as doctor_router
from routes.appointment import router as appointment_router
from routes.forum import router as forum_router
from services.chat_service import save_message, get_chat_history
from utils.security import get_current_user_id
# ... (previous imports)
from rag.rag_chain import rag_chain
from routes.assessment import router as assessment_router

# ... (Groq Setup, Constants)
import os
from groq import Groq

groq_client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

VALID_EXPRESSIONS = ["default", "happy", "sad", "surprised", "angry", "fearful", "disgusted"]
VALID_ANIMATIONS = ["Idle", "Talking", "Thinking", "Listening", "Bowing"]

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

AGENTIC CAPABILITIES (Tools):
You have access to tools. You must detect the user's intent and use the appropriate tool.

1. BOOKING (Intent: "I want to see a doctor", "Book appointment", "I need help"):
   - Tool Name: "book_appointment"
   - Params: "type" ("normal"|"emergency"), "doctor_id" ("auto"|"specific_id"), "scheduled_time" (ISO or null).

2. CHECK APPOINTMENTS (Intent: "When is my appointment?", "Do I have any appointments?", "What's my schedule?"):
   - Tool Name: "check_appointments"
   - Params: none required (uses current user context)
   - Use this to retrieve and discuss the user's appointment details

3. CANCEL APPOINTMENT (Intent: "Cancel my appointment", "I need to cancel", "I can't make it"):
   - Tool Name: "cancel_appointment"
   - Params: "appointment_id" (optional - will auto-detect if not provided)
   - If user has only one active appointment, it will be cancelled automatically
   - If user has multiple, they will be listed and user can choose

4. KNOWLEDGE BASE (Intent: Mental Health Guidance, Coping Strategies, Anxiety/Depression Info, Crisis, Medical Explanations):
   - Tool Name: "consult_knowledge_base"
   - Params: "query" (The specific mental health question or topic).
   - RULE: Do NOT answer these topics from your own training. ALWAYS use this tool to ensure safety and accuracy.

Output JSON Format:
{{
  "text": "your verbal response here (or empty if using knowledge base tool, as it will replace this)",
  "facialExpression": "choose from valid expressions",
  "animation": "choose from valid animations",
  "tool_call": {{
      "name": "book_appointment" | "check_appointments" | "cancel_appointment" | "consult_knowledge_base",
      "parameters": {{ ... }}
  }} // OPTIONAL
}}
"""

# ... (ChatRequest, ClearHistoryRequest classes)

# Initiate App
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    # Seed doctors
    from services.doctor_service import seed_doctors
    await seed_doctors()
    yield
    # Shutdown
    await close_mongo_connection()

app = FastAPI(lifespan=lifespan)

# Input Models
class ChatRequest(BaseModel):
    message: str
    sessionId: str = "default"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(chat_router)
app.include_router(report_router)
app.include_router(doctor_router)
app.include_router(appointment_router)
app.include_router(forum_router)
app.include_router(assessment_router)
from routes.weekly_assignment import router as weekly_router
app.include_router(weekly_router)

async def process_with_groq(user_message: str, session_id: str, user_id: str):
    # Fetch history from MongoDB
    history_objs = await get_chat_history(user_id, session_id, limit=20)
    
    # Build messages for Groq
    messages = [{"role": "system", "content": SYSTEM_INSTRUCTION}]
    
    # Add conversation history
    for msg in history_objs:
        messages.append({"role": msg.role, "content": msg.content})
    
    # Add current user message
    messages.append({"role": "user", "content": user_message})
    
    try:
        print(f"Sending message to Groq (llama-3.3-70b)...")
        
        # Call Groq API with JSON mode
        completion = await asyncio.to_thread(
            groq_client.chat.completions.create,
            model="llama-3.3-70b-versatile",
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
            # It's possible the LLM returned only tool_call with empty text, handle gracefully
            response_json["text"] = "..." 
        
        # Ensure valid expressions and animations
        if "facialExpression" not in response_json or response_json["facialExpression"] not in VALID_EXPRESSIONS:
            response_json["facialExpression"] = "default"
        
        if "animation" not in response_json or response_json["animation"] not in VALID_ANIMATIONS:
            response_json["animation"] = "Talking"

        # --- TOOL CALL HANDLING ---
        if "tool_call" in response_json and response_json["tool_call"]:
            tool = response_json["tool_call"]
            tool_name = tool.get("name")
            print(f"🛠️ Executing Tool: {tool_name}")
            params = tool.get("parameters", {})

            if tool_name == "book_appointment":
                # Execute booking logic
                from services.appointment_service import book_appointment
                appt_data = params.copy()
                
                # Handle 'auto' doctor assignment
                if appt_data.get("doctor_id") == "auto":
                    from services.doctor_service import get_all_doctors
                    doctors = await get_all_doctors()
                    if doctors:
                        appt_data["doctor_id"] = str(doctors[0].id)
                
                try:
                    new_appt = await book_appointment(user_id, appt_data)
                    print(f"✅ Tool Success: Appointment {new_appt.id} created.")
                    response_json["data"] = {
                        "action": "appointment_booked",
                        "appointment_id": str(new_appt.id)
                    }
                except Exception as e:
                    print(f"❌ Tool Failed: {e}")
                    response_json["text"] = "I tried to book the appointment, but something went wrong. Please try again."

            elif tool_name == "check_appointments":
                # Retrieve user's appointments
                from services.appointment_service import get_patient_appointments
                from services.doctor_service import get_all_doctors
                
                try:
                    appointments = await get_patient_appointments(user_id)
                    print(f"📅 Retrieved {len(appointments)} appointments for user")
                    
                    if not appointments:
                        response_json["text"] = "You don't have any appointments scheduled at the moment. Would you like me to help you book one?"
                        response_json["facialExpression"] = "default"
                    else:
                        # Get doctor names for better context
                        doctors = await get_all_doctors()
                        doctor_map = {str(d.id): d.name for d in doctors}
                        
                        # Format appointment info for LLM context
                        appt_summaries = []
                        for idx, appt in enumerate(appointments[:5], 1):  # Limit to 5 most recent
                            doctor_name = doctor_map.get(appt.doctor_id, "a doctor")
                            time_str = appt.scheduled_time.strftime("%B %d at %I:%M %p") if appt.scheduled_time else "pending scheduling"
                            appt_summaries.append(f"{idx}. {appt.type.capitalize()} appointment with Dr. {doctor_name} on {time_str} (Status: {appt.status}, ID: {str(appt.id)})")
                        
                        context_info = "\n".join(appt_summaries)
                        
                        # Store appointment IDs in response for potential follow-up cancellations
                        response_json["data"] = {
                            "action": "appointments_listed",
                            "appointments": [
                                {
                                    "id": str(appt.id),
                                    "doctor_id": appt.doctor_id,
                                    "type": appt.type,
                                    "scheduled_time": appt.scheduled_time.isoformat() if appt.scheduled_time else None,
                                    "status": appt.status
                                } for appt in appointments[:5]
                            ]
                        }
                        
                        # Re-prompt LLM with appointment context to generate natural response
                        contextual_prompt = f"""The user asked about their appointments. Here are their current appointments:

{context_info}

Please summarize this information conversationally and warmly, as SANA would."""
                        
                        from groq import Groq
                        contextual_completion = await asyncio.to_thread(
                            groq_client.chat.completions.create,
                            model="llama-3.3-70b-versatile",
                            messages=[
                                {"role": "system", "content": "You are SANA, a warm AI health companion. Summarize appointment info naturally."},
                                {"role": "user", "content": contextual_prompt}
                            ],
                            temperature=0.7,
                            max_tokens=200
                        )
                        
                        natural_response = contextual_completion.choices[0].message.content
                        response_json["text"] = natural_response.strip()
                        response_json["facialExpression"] = "happy"
                        response_json["animation"] = "Talking"
                        
                except Exception as e:
                    print(f"❌ Check Appointments Failed: {e}")
                    import traceback
                    traceback.print_exc()
                    response_json["text"] = "I'm having trouble checking your appointments right now. Could you try again?"

            elif tool_name == "cancel_appointment":
                # Cancel an appointment
                from services.appointment_service import update_appointment_status, get_appointment, get_patient_appointments
                from services.doctor_service import get_all_doctors
                
                appointment_id = params.get("appointment_id")
                
                # If no ID provided, try to intelligently figure out which appointment to cancel
                if not appointment_id:
                    try:
                        appointments = await get_patient_appointments(user_id)
                        # Filter only active appointments (not cancelled or completed)
                        active_appointments = [a for a in appointments if a.status not in ["cancelled", "completed"]]
                        
                        if not active_appointments:
                            response_json["text"] = "You don't have any active appointments to cancel right now."
                            response_json["facialExpression"] = "default"
                        elif len(active_appointments) == 1:
                            # Only one active appointment - cancel it directly
                            appt = active_appointments[0]
                            updated = await update_appointment_status(str(appt.id), "cancelled")
                            if updated:
                                doctors = await get_all_doctors()
                                doctor_map = {str(d.id): d.name for d in doctors}
                                doctor_name = doctor_map.get(appt.doctor_id, "your doctor")
                                time_str = appt.scheduled_time.strftime("%B %d at %I:%M %p") if appt.scheduled_time else "pending"
                                
                                print(f"✅ Auto-cancelled appointment {appt.id}")
                                response_json["text"] = f"I've cancelled your {appt.type} appointment with Dr. {doctor_name} scheduled for {time_str}. Would you like to reschedule or is there anything else I can help with?"
                                response_json["facialExpression"] = "default"
                                response_json["animation"] = "Talking"
                            else:
                                response_json["text"] = "I had trouble cancelling that appointment. Could you try again?"
                        else:
                            # Multiple active appointments - list them
                            doctors = await get_all_doctors()
                            doctor_map = {str(d.id): d.name for d in doctors}
                            
                            appt_list = []
                            for idx, appt in enumerate(active_appointments, 1):
                                doctor_name = doctor_map.get(appt.doctor_id, "a doctor")
                                time_str = appt.scheduled_time.strftime("%B %d at %I:%M %p") if appt.scheduled_time else "pending"
                                appt_list.append(f"{idx}. {appt.type.capitalize()} with Dr. {doctor_name} on {time_str}")
                            
                            appt_text = "\n".join(appt_list)
                            response_json["text"] = f"You have multiple appointments. Which one would you like to cancel?\n\n{appt_text}\n\nJust tell me the number or describe which one."
                            response_json["facialExpression"] = "default"
                            
                            # Store appointment IDs for potential follow-up
                            response_json["data"] = {
                                "action": "awaiting_cancellation_choice",
                                "appointments": [
                                    {
                                        "id": str(appt.id),
                                        "index": idx,
                                        "doctor_id": appt.doctor_id,
                                        "scheduled_time": appt.scheduled_time.isoformat() if appt.scheduled_time else None
                                    } for idx, appt in enumerate(active_appointments, 1)
                                ]
                            }
                    except Exception as e:
                        print(f"❌ Auto-cancel Failed: {e}")
                        import traceback
                        traceback.print_exc()
                        response_json["text"] = "I'm having trouble accessing your appointments. Could you try again?"
                else:
                    # Appointment ID was provided - cancel it directly
                    try:
                        # Verify appointment exists and belongs to user
                        appt = await get_appointment(appointment_id)
                        if not appt:
                            response_json["text"] = "I couldn't find that appointment. Would you like me to show you your current appointments?"
                            response_json["facialExpression"] = "sad"
                        elif appt.user_id != user_id:
                            response_json["text"] = "I'm sorry, but I can't cancel that appointment as it doesn't belong to you."
                            response_json["facialExpression"] = "sad"
                        else:
                            # Cancel the appointment
                            updated = await update_appointment_status(appointment_id, "cancelled")
                            if updated:
                                print(f"✅ Appointment {appointment_id} cancelled successfully")
                                response_json["text"] = "I've cancelled that appointment for you. Is there anything else I can help you with? If you'd like to reschedule, just let me know."
                                response_json["facialExpression"] = "default"
                                response_json["animation"] = "Talking"
                            else:
                                response_json["text"] = "I had trouble cancelling that appointment. Could you try again?"
                                response_json["facialExpression"] = "sad"
                    except Exception as e:
                        print(f"❌ Cancel Appointment Failed: {e}")
                        import traceback
                        traceback.print_exc()
                        response_json["text"] = "I'm having trouble cancelling that appointment right now. Please try again."

            elif tool_name == "consult_knowledge_base":
                # RAG Logic
                query = params.get("query", user_message)
                print(f"🧠 RAG Query: {query}")
                
                rag_response = await rag_chain.generate_response(query)
                
                if rag_response:
                    print("✅ RAG Response generated.")
                    response_json["text"] = rag_response
                    # Adjust expression for supportive tone
                    response_json["facialExpression"] = "default" 
                    response_json["animation"] = "Talking"
                else:
                     print("⚠️ RAG returned None, falling back.")
                     response_json["text"] = "I want to be careful here. I don't have enough verified information to answer that safely. Let's talk to a professional."

        # Save interaction to MongoDB
        await save_message(user_id=user_id, role="user", content=user_message, session_id=session_id)
        await save_message(user_id=user_id, role="assistant", content=response_json["text"], session_id=session_id)
        
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

from services.audio_utils import transcribe_audio, generate_tts

@app.post("/chat")
async def chat(request: ChatRequest, user_id: str = Depends(get_current_user_id)):
    try:
        response_data = await process_with_groq(request.message, request.sessionId, user_id)
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
    voiceId: str = Form('en-US-AriaNeural'),
    user_id: str = Depends(get_current_user_id)
):
    try:
        # Save audio file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            content = await file.read()
            temp_audio.write(content)
            temp_audio_path = temp_audio.name
        
        # Speech-to-text
        user_text = await transcribe_audio(temp_audio_path)
        print(f"Transcribed: {user_text}")
        
        # Clean up temp file
        os.unlink(temp_audio_path)
        
        # Get LLM response (saves to DB)
        response_data = await process_with_groq(user_text, sessionId, user_id)
        
        # Generate TTS
        try:
            # We don't have facial expression logic decoupled yet, using defaults for now
            audio_url = await generate_tts(response_data["text"], voiceId)
        except Exception as e:
            print(f"TTS Error: {e}")
            audio_url = None
            
        return {
            "text": response_data["text"],
            "facialExpression": response_data.get("facialExpression", "default"),
            "animation": response_data.get("animation", "Idle"),
            "audio": audio_url,
            "data": response_data.get("data")
        }

    except Exception as e:
        print(f"Talk endpoint error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Note: /clear-history is now handled by chat_router via DELETE /chat/history
# But for backward compatibility if needed, we can keep it or alias it.
# The user asked for "Chat APIs... Fetch recent chat history".
# I've added full routers. I'll drop the old /clear-history or map it to the service.

@app.get("/")
async def root():
    return {
        "message": "SANA Backend - Mental Health AI Companion",
        "llm": "Groq (llama-3.3-70b-versatile)",
        "db": "MongoDB Connected",
        "endpoints": ["/chat", "/talk", "/auth", "/users", "/reports", "/doctor"]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3000)
