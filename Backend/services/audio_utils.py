import whisper
import edge_tts
import io
import base64
import os

# Whisper model (lazy loaded singleton)
_whisper_model = None

def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        print("Loading Whisper model (base)...")
        _whisper_model = whisper.load_model("base")
        print("✅ Whisper model loaded.")
    return _whisper_model

async def transcribe_audio(file_path: str) -> str:
    model = get_whisper_model()
    result = model.transcribe(file_path)
    return result["text"]

async def generate_tts(text: str, voice_id: str = "en-US-AriaNeural") -> str:
    try:
        print(f"🎤 Generating TTS for: '{text[:20]}...' with voice {voice_id}")
        communicate = edge_tts.Communicate(text, voice_id)
        tts_output = io.BytesIO()
        
        # Collect audio data
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                tts_output.write(chunk["data"])
                
        # Value check
        audio_bytes = tts_output.getvalue()
        if len(audio_bytes) == 0:
            print("⚠️ TTS Warning: Generated 0 bytes of audio.")
            return None
            
        # Convert to base64
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        print(f"✅ TTS Generated. Size: {len(audio_base64)} chars")
        return f"data:audio/mp3;base64,{audio_base64}"
        
    except Exception as e:
        print(f"❌ TTS Error: {e}")
        # Return specific error or fallback? For now, None to prevent crash.
        return None
