import edge_tts
import asyncio

async def test_tts():
    print("Testing Edge TTS...")
    text = "Hello, I am SANA. This is a test of the voice system."
    voice = "en-US-JennyNeural"
    output_file = "test_audio.mp3"
    
    try:
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_file)
        print(f"✅ Success! Audio saved to {output_file}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_tts())
