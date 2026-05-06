import os
import sys
from utils.config import settings
import google.generativeai as genai

def test_gemini():
    print(f"Testing Gemini with Model: {settings.GEMINI_MODEL}")
    print(f"API Key (first 5 chars): {settings.GOOGLE_API_KEY[:5]}...")
    
    try:
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        print("\nAvailable Models:")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"- {m.name}")
        
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        response = model.generate_content("Hello, this is a test.")
        print("Success! Gemini response:")
        print(response.text)
    except Exception as e:
        print("\n--- ERROR DETECTED ---")
        print(f"Type: {type(e).__name__}")
        print(f"Message: {str(e)}")
        print("----------------------")

if __name__ == "__main__":
    # Add parent dir to path to import utils
    sys.path.append(os.getcwd())
    test_gemini()
