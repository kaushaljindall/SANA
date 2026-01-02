import os
import json
from datetime import datetime
from typing import Dict, Optional, List
from groq import Groq
from models.assessment import AssessmentSession, AssessmentResponseItem, AssessmentQuestion
from db.database import db
from bson import ObjectId

class AssessmentService:
    def __init__(self):
        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    @property
    def collection(self):
        if db.db is not None:
            return db.db["assessments"]
        print("❌ AssessmentService: db.db is None! Database not connected?")
        # debug
        print(f"DEBUG: db object: {db}")
        return None

    async def start_session(self, user_id: str, context: Optional[str] = None) -> AssessmentSession:
        # Create new session
        session = AssessmentSession(user_id=user_id)
        
        col = self.collection
        if col is not None:
            new_session = await col.insert_one(session.model_dump(by_alias=True, exclude=["id"]))
            session.id = str(new_session.inserted_id)
            print(f"✅ Session Started. ID: {session.id}")
        else:
            print("❌ Start Session Failed: Collection is None.")
            # We should probably throw here to alert the frontend immediately
            raise Exception("Database connection unavailable. Cannot start session.")
            
        return session

    async def get_session(self, session_id: str) -> Optional[AssessmentSession]:
        if self.collection is None:
            return None
        try:
            doc = await self.collection.find_one({"_id": ObjectId(session_id)})
            if doc:
                return AssessmentSession(**doc)
            return None
        except Exception:
            return None

    async def analyze_and_update(self, session: AssessmentSession, response_text: str, current_question_text: str):
        # 1. ANALYZER AGENT
        analysis_prompt = f"""
        Analyze this user response to the mental health assessment question.
        Question: "{current_question_text}"
        Response: "{response_text}"
        
        Task:
        1. Identify sentiment (-1.0 to 1.0).
        2. Assign impact scores to dimensions (0.0=Low Strength/High Risk, 1.0=High Strength).
        3. Detect RISK flags (self-harm, crisis).
        
        Dimensions:
        - emotional_regulation
        - stress_resilience
        - self_awareness
        - social_support
        - coping_confidence

        Output JSON ONLY:
        {{
            "sentiment": float,
            "risk_flag": bool,
            "risk_reason": "string or null",
            "dimension_updates": {{ "dimension_name": float_score_impact }}
        }}
        """
        
        completion = self.groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "system", "content": "You are a clinically aware AI analysis engine. Output JSON only."}, 
                      {"role": "user", "content": analysis_prompt}],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        
        analysis = json.loads(completion.choices[0].message.content)
        
        # Crisis Check
        if analysis.get("risk_flag"):
            # Mark session as needing intervention (handled by controller)
            return analysis, True

        # Update Session Dimensions (Simple Moving Average or similar)
        # For prototype, we just average the new score with the old one
        updates = analysis.get("dimension_updates", {})
        for dim, score in updates.items():
            if dim in session.dimensions:
                current = session.dimensions[dim]
                # Weighted update: 70% old, 30% new
                session.dimensions[dim] = (current * 0.7) + (score * 0.3)
        
        return analysis, False

    async def generate_next_question(self, session: AssessmentSession) -> str:
        # 2. ORCHESTRATOR AGENT
        # Identify weakest dimension or next logical step
        sorted_dims = sorted(session.dimensions.items(), key=lambda x: x[1])
        focus_dim = sorted_dims[0][0] # Focus on lowest score
        
        prompt = f"""
        Generate the next single reflective question for a self-assessment.
        Current Profile: {session.dimensions}
        Focus Area: {focus_dim} (Needs exploration)
        History: {len(session.history)} questions asked.
        
        Rules:
        - Be gentle, non-intrusive, and open-ended.
        - Tone: Reflective and supportive.
        - Max depth: {session.current_depth} (1=Shallow, 3=Deep).
        
        Output JSON:
        {{
            "question_text": "string",
            "rationale": "string"
        }}
        """
        
        completion = self.groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "system", "content": "You are an expert therapist AI designing questions."}, 
                      {"role": "user", "content": prompt}],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(completion.choices[0].message.content)
        return result["question_text"]

    async def submit_response(self, session_id: str, response_text: str):
        session = await self.get_session(session_id)
        if not session:
            raise ValueError("Session not found")
            
        # Get last question (if any) or assume initial Context
        last_q = session.history[-1].question_text if session.history else "Initial Context"
        
        # Analyze
        analysis, is_crisis = await self.analyze_and_update(session, response_text, last_q)
        
        if is_crisis:
            # Crisis Flow
            return {
                "session_id": session_id,
                "should_stop": True,
                "next_question": None,
                "feedback": "I'm noticing you might be going through a very difficult time. I want to prioritize your safety. Please consider reaching out to a professional or a crisis line. You are not alone."
            }
            
        # Record History
        history_item = AssessmentResponseItem(
            question_id=f"q_{len(session.history)+1}",
            question_text=last_q,
            user_response=response_text,
            analysis=analysis.get("dimension_updates", {})
        )
        session.history.append(history_item)
        session.questions_answered += 1
        
        # Stop condition (e.g., 5 questions for now)
        if session.questions_answered >= 5:
            await self._save_session(session)
            return {
                "session_id": session_id,
                "should_stop": True,
                "next_question": None,
                "feedback": "Thank you for sharing. I've gathered a good sense of where you're at. Your resilience in [Strength Area] is notable, and we can work on [Weak Area] together."
            }

        # Generate Next
        next_q = await self.generate_next_question(session)
        
        # Save State
        await self._save_session(session)
        
        return {
            "session_id": session_id,
            "next_question": next_q,
            "progress": session.questions_answered,
            "should_stop": False
        }

    async def _save_session(self, session: AssessmentSession):
        if self.collection is not None:
            await self.collection.replace_one(
                {"_id": ObjectId(session.id)},
                session.model_dump(by_alias=True, exclude=["id"])
            )

assessment_service = AssessmentService()
