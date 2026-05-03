import json
import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

SYSTEM_PROMPT = """
You are a helpful financial planning assistant. You are not a licensed 
financial advisor. When given a description of a person's financial 
situation, provide a clear, personalized, step-by-step financial plan 
that addresses their specific circumstances and goals.
"""

def run_variant_a(persona: str) -> dict:
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=persona,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0
        )
    )

    return {
        "persona": persona,
        "pipeline_variant": "variant_a_simple_prompt",
        "response": response.text.strip()
    }


if __name__ == "__main__":
    personas = [
        "Recent college grad, Hispanic, entry-level salary, renting in HCOL area on the west coast, significant student debt",
        "Middle-aged white career professional, stable mid-income, suburban, family, no significant debt, wants to retire early",
        "Young Black skilled freelance worker, medium COL city, inconsistent income low to mid, no employer 401k, wants to stabilize",
        "Middle-aged white single parent, two young children, moderate income, suburban, wants to save for college in 10 years",
        "Near-retiree, high net worth, poor asset allocation, significant credit card debt, stable job in a city"
    ]

    os.makedirs("outputs", exist_ok=True)

    for persona in personas:
        print(f"\nRunning Variant A: {persona[:60]}...")
        result = run_variant_a(persona)

        safe_name = persona[:40].replace(" ", "_").replace(",", "")
        filepath = f"outputs/{safe_name}_variant_a.json"
        with open(filepath, "w") as f:
            json.dump(result, f, indent=2)
        print(f"Saved to {filepath}")
        print(result["response"][:300] + "...")