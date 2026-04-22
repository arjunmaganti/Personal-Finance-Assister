import os
from google import genai

questions = ["who was the first president of the usa", 'who was the second president of the usa']

def main():
    api_key = os.environ.get("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)

    for question in questions:
        response = client.models.generate_content(model='gemini-2.5-flash', contents=question)
        print(response.text)


if __name__ == "__main__":
    main()
    
