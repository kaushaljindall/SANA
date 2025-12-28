import google.generativeai as genai
import os
from dotenv import load_dotenv
import asyncio

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
# Match main.py config exactly
genai.configure(api_key=api_key, transport="rest")

model_name = "gemini-2.5-flash"
print(f"Testing connectivity for: {model_name}")

async def test():
    try:
        model = genai.GenerativeModel(model_name)
        chat = model.start_chat(history=[])
        print("Sending message...")
        # Use simple generation first, not chat, to rule out chat history issues
        # But main.py uses chat. Let's send a chat message.
        response = await model.generate_content_async("Hello, strictly return just the word: Hello")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
