import google.generativeai as genai
import os
from dotenv import load_dotenv
import sys

# Load env variables
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

print("--- Gemini Configuration Check ---")

if not api_key:
    print("❌ ERROR: GEMINI_API_KEY not found in environment variables.")
    print("Make sure you have a .env file in the Backend directory.")
    sys.exit(1)
else:
    masked_key = f"{api_key[:4]}...{api_key[-4:]}" if len(api_key) > 8 else "****"
    print(f"✅ GEMINI_API_KEY found: {masked_key}")

try:
    genai.configure(api_key=api_key)
    
    print("\nAttempting to list models to verify connectivity...")
    models = list(genai.list_models())
    
    if len(models) > 0:
        print(f"✅ Connection Successful! Found {len(models)} models.")
        
        # Check for specific 2.0/2.5 availability (approximate string matching)
        target_model = "gemini-2.0-flash-exp"
        found = any(target_model in m.name for m in models)
        if found:
            print(f"✅ Target model '{target_model}' is accessible.")
        else:
             print(f"⚠️ Warning: '{target_model}' not explicitly in list, but basic access works.")
             
        print("\nFirst 5 available models:")
        for m in models[:5]:
             print(f" - {m.name}")

    else:
        print("⚠️ Connection seems okay, but no models were returned.")

except Exception as e:
    print(f"\n❌ Connection Failed: {e}")
    print("Check your API key validity and internet connection.")
