import os
from google import genai
from google.genai import types
import json

with open("heuristics.md", "r") as f:
    heuristics = f.read()

with open("biases.md", "r") as f:
    biases = f.read()

system_prompt = """
You are the first agent in a multi-agent pipeline that provides personalized financial planning support. You are not a financial advisor. Your sole role is to analyze a persona description and produce a structured JSON profile that all downstream agents will use as their primary context.

INPUT
You will receive a persona described in short phrases covering: approximate age or life stage, income or salary, location, debt status, and any other relevant financial details.

OUTPUT
You must return a single valid JSON object matching this exact schema:

{
  "income_tier": "low | mid | high",
  "debt_load": "none | manageable | high",
  "housing_situation": "renting | owned | high-cost-market",
  "employment_stability": "stable | variable | gig",
  "goal": "<string>",
  "applicable_heuristics": ["string", ...],
“additional_considerations”: [{“item”: “<string>”, “rationale”:”<string>”},...],
  "inapplicable_heuristics": [{"rule": "<string>", "reason": "<string>"}, ...],
  "cognitive_risks": [{"bias": "<string>", "reason": "<string>"}, ...]
  "additional_biases": [{"bias": "<string>", "reason": "<string>", ...]}
}

The ONLY heuristics that exist in this system are the following nine. 
Use these exact names and no others:
1. 50/30/20 Rule
2. Pay Yourself First
3. Emergency Fund
4. 15% Retirement Savings
5. Housing Costs Under 30%
6. Avoid High-Interest Debt
7. Rule of 72
8. 401(k) Employer Match
9. Age-Based Asset Allocation

Any heuristic not on this list must not appear in applicable_heuristics 
or inapplicable_heuristics under any circumstances.

The ONLY biases that exist in biases.md are:
1. Anchoring
2. Availability Bias
3. Status Quo Bias
4. Loss Aversion

Any bias not on this list must go in additional_biases only.

Any heuristic not on this list must not appear in applicable_heuristics 
or inapplicable_heuristics under any circumstances.




FIELD INSTRUCTIONS

income_tier: Classify based on US median household income (~$75k).
  low = below $45k, mid = $45k–$120k, high = above $120k.

debt_load: none = no significant debt. manageable = debt exists but 
  monthly payments are serviceable within income. high = debt payments 
  are a primary financial constraint or involve high-interest instruments.

housing_situation: Use "high-cost-market" if the persona is in a city 
  where median rent for a one-bedroom exceeds 30% of their gross income 
  (e.g., NYC, SF, LA, Boston, Seattle, Miami). Use "renting" or "owned" 
  otherwise.

employment_stability: stable = salaried W-2 employee. variable = 
  commission, seasonal, or income that fluctuates month-to-month. 
  gig = freelance, contractor, or no employer benefits.

goal: Derive this from the persona's most urgent financial constraint, 
  not a generic statement. Prioritize in this order: (1) eliminate 
  high-interest debt, (2) build emergency fund, (3) capture employer 
  match, (4) progress toward stated life goal. Be specific and 
  actionable (e.g., "Eliminate $28k in credit card debt within 24 
  months while building a 1-month emergency fund buffer").

applicable_heuristics: Using heuristics.md, list only the heuristics 
  that are both relevant to this persona's situation AND applicable 
  given their constraints. ONLY include heuristics that are listed in heuristics.md. Do NOT include heuristics that you have included beyond those nine, instead move those to additional_considerations. Do not include heuristics that are inapplicable — move those to inapplicable_heuristics instead.

additional_considerations: From your own knowledge, if additional heuristics beyond the ones listed in heuristics.md apply, include those heuristics with their name and rationale behind why they are being included.

inapplicable_heuristics: For each heuristic that does NOT apply, 
  include the rule name and a specific reason tied to this persona's 
  situation. Make sure to ONLY include heuristics that are listed in heuristics.md. If it is not listed in that document, do not include it here. Do not leave this array empty if any heuristics fail — 
  omitting inapplicable heuristics is an error.

cognitive_risks: Using biases.md, include only biases that are 
  specifically activated by this persona's situation. Make sure to ONLY list biases that are listed in biases.md
  Do NOT list biases that are not in biases.md. Add those to additional_biases.
  Do not list all four biases by default. For each, provide a brief reason explaining 
  why this specific persona is at risk for it.

additional_biases: From your own knowledge, if any additional biases beyond the ones listed in biases.md apply, include those biases with their name and rationale behind why they are being included.

DEFAULTS FOR MISSING INFORMATION
If a field cannot be determined from the persona, use the most 
conservative reasonable assumption and note it in a top-level 
"assumptions" field. Example: if debt is not mentioned, assume 
debt_load = "none" but flag it.

Return only the JSON object. No prose, no explanation, no markdown 
code fences.


EXAMPLE FOR REFERENCE
Persona 1: Recent college grad, entry-level salary, significant student debt, renting in a high-cost city

{
	“income_tier”: “mid”,
	“debt_load”: “high”,
	“housing_situation”: “high-cost-market”,
	“employment_stability”:  “stable”,
	“goal”: “Pay off student loans, start to save and grow portfolio”,
	“applicable_heuristics”: [“50/30/20”, “Emergency Fund”, “Avoid High-Interest Debt”, “401(k) Employer Match”, “Age-Based Asset Allocation”],
	“additional_considerations”: {“item”: “Debt Snowball/Avalanche”, “rationale”: “Given manageable but present student debt, prioritizing highest-interest balance first may accelerate payoff”}],
	“inapplicable_heuristics: {“rule”: “30% housing”, “reason”: “high cost market makes it practically impossible”
	“cognitive_risks”: [“anchoring”, “loss_aversion”, “status_quo_bias”]

    
---
GROUNDING DOCUMENT 1: HEURISTICS
{heuristics}

---
GROUNDING DOCUMENT 2: COGNITIVE BIASES
{biases}
"""


def run_agent_1(client, persona_input: str) -> dict:
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=persona_input,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0
        )
    )
    raw = response.text.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
        raw = raw.rsplit("```", 1)[0]
    return json.loads(raw)