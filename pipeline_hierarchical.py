import json
import os
import time
from google import genai

from agent1 import run_agent_1
from agent2 import run_agent_2
from agent3 import run_agent_3
from agent4 import run_agent_4

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))


def should_run_heuristic_strategist(agent_1_output: dict) -> tuple[bool, str]:
    applicable = agent_1_output.get("applicable_heuristics", [])
    goal = agent_1_output.get("goal", "").lower()
    employment = agent_1_output.get("employment_stability", "")

    if len(applicable) < 3:
        return False, "Fewer than 3 applicable heuristics — baseline would not be meaningful"

    if any(word in goal for word in ["early retirement", "fire", "retire early"]):
        return False, "FIRE goal detected — standard heuristic baseline not applicable"

    if employment == "gig" and len(applicable) <= 3:
        return False, "Gig worker with limited applicable heuristics — baseline would be too generic"

    return True, "Standard persona with sufficient applicable heuristics"


def run_agent_3_no_baseline(
    client,
    persona: str,
    agent_1_output: dict,
    skip_reason: str
) -> dict:
    no_baseline_note = {
        "baseline_skipped": True,
        "reason": skip_reason,
        "note": "No heuristic baseline was generated for this persona. "
                "Produce an optimized plan directly from the persona "
                "profile without referencing a baseline."
    }
    return run_agent_3(client, persona, agent_1_output, no_baseline_note)


def run_hierarchical_pipeline(
    persona: str,
    save_outputs: bool = True,
    output_dir: str = "outputs"
) -> dict:

    print("Orchestrator: Analyzing persona...")
    a1 = run_agent_1(client, persona)

    run_agent_2_flag, routing_reason = should_run_heuristic_strategist(a1)

    routing_decisions = {
        "persona_profiler": {"called": True, "reason": "Always called first"},
        "heuristic_strategist": {"called": run_agent_2_flag, "reason": routing_reason},
        "goal_optimizer": {"called": True, "reason": "Always called"},
        "quality_control": {"called": True, "reason": "Always called last"}
    }

    if run_agent_2_flag:
        print(f"Orchestrator: Calling Heuristic Strategist — {routing_reason}")
        a2 = run_agent_2(client, persona, a1)
        a3 = run_agent_3(client, persona, a1, a2)
    else:
        print(f"Orchestrator: Skipping Heuristic Strategist — {routing_reason}")
        a2 = None
        a3 = run_agent_3_no_baseline(client, persona, a1, routing_reason)

    a4 = run_agent_4(client, persona, a1, a2, a3, pipeline_variant="hierarchical")

    full_output = {
        "persona": persona,
        "pipeline_variant": "hierarchical",
        "routing_decisions": routing_decisions,
        "agent_1": a1,
        "agent_2": a2,
        "agent_3": a3,
        "agent_4": a4
    }

    if save_outputs:
        os.makedirs(output_dir, exist_ok=True)
        safe_name = persona[:40].replace(" ", "_").replace(",", "")
        filepath = os.path.join(output_dir, f"{safe_name}_hierarchical.json")
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
            result = run_hierarchical_pipeline(persona)
            print("\nRouting decisions:")
            for agent, decision in result["routing_decisions"].items():
                status = "✓ Called" if decision["called"] else "✗ Skipped"
                print(f"  {status} — {agent}: {decision['reason']}")
            print("\nAgent 4 Summary:")
            print(result["agent_4"]["user_facing_summary"])
        except Exception as e:
            print(f"Pipeline failed: {e}")

        print("Waiting 30 seconds before next persona...")
        time.sleep(30)