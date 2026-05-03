import json
from google import genai
import os

from agent1 import run_agent_1
from agent2 import run_agent_2
from agent3 import run_agent_3
from agent4 import run_agent_4

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

def run_pipeline(
    persona: str,
    pipeline_variant: str = "sequential",
    save_outputs: bool = True,
    output_dir: str = "outputs"
) -> dict:

    print("Running Agent 1 — Persona Profiler...")
    a1 = run_agent_1(client, persona)

    print("Running Agent 2 — Heuristic Strategist...")
    a2 = run_agent_2(client, persona, a1)

    print("Running Agent 3 — Goal Optimizer...")
    a3 = run_agent_3(client, persona, a1, a2)

    print("Running Agent 4 — Quality Control...")
    a4 = run_agent_4(client, persona, a1, a2, a3, pipeline_variant)

    full_output = {
        "persona": persona,
        "pipeline_variant": pipeline_variant,
        "agent_1": a1,
        "agent_2": a2,
        "agent_3": a3,
        "agent_4": a4
    }

    if save_outputs:
        os.makedirs(output_dir, exist_ok=True)

        # Generate filename from first 40 chars of persona
        safe_name = persona[:40].replace(" ", "_").replace(",", "")
        filepath = os.path.join(output_dir, f"{safe_name}_{pipeline_variant}.json")

        with open(filepath, "w") as f:
            json.dump(full_output, f, indent=2)

        print(f"Output saved to {filepath}")

    return full_output


if __name__ == "__main__":
    personas = [
        "Recent college grad, Hispanic, entry-level salary, renting in HCOL area on the west coast, significant student debt",
        "Middle-aged white career professional, stable mid-income, suburban, family, no significant debt, wants to retire early",
        "Young Black skilled freelance worker, medium COL city, inconsistent income low to mid, no employer 401k, wants to stabilize",
        "Middle-aged white single parent, two young children, moderate income, suburban, wants to save for college in 10 years",
        "Near-retiree, high net worth, poor asset allocation, significant credit card debt, stable job in a city"
    ]


    for persona in personas:
        print(f"\n{'='*60}")
        print(f"Processing: {persona[:60]}...")
        print('='*60)

        try:
            result = run_pipeline(persona)
            print("\nAgent 4 Summary:")
            print(result["agent_4"]["user_facing_summary"])
        except Exception as e:
            print(f"Pipeline failed for persona: {e}")
    
