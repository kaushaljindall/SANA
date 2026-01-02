import asyncio
import edge_tts

TEXT = "Hello! This is a test of the Edge TTS system for SANA."
VOICE = "en-US-AriaNeural"
OUTPUT_FILE = "test_audio.mp3"

async def main():
    print(f"Generating TTS for: '{TEXT}'")
    communicate = edge_tts.Communicate(TEXT, VOICE)
    await communicate.save(OUTPUT_FILE)
    print(f"✅ Saved audio to {OUTPUT_FILE}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"❌ Error: {e}")
