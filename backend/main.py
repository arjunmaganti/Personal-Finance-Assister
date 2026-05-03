import asyncio
import os
import time
from contextlib import asynccontextmanager

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from pydantic import BaseModel

from agent1 import run_agent_1
from agent2 import run_agent_2
from agent3 import run_agent_3
from agent4 import run_agent_4
from pipeline_hierarchical import run_hierarchical_pipeline
from pipeline_sequential import run_pipeline
from variants.variant_a import run_variant_a
from variants.variant_b import run_variant_b

# ── Client ─────────────────────────────────────────────────────────────────
# Created once at startup and shared across all requests.
# This avoids creating a new connection for every API call.
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))


# ── Lifespan ───────────────────────────────────────────────────────────────
# Code inside the lifespan runs once when the server starts and once when
# it shuts down. We use it to confirm the API key is present before
# accepting any requests.
@asynccontextmanager
async def lifespan(app: FastAPI):
    if not os.environ.get("GEMINI_API_KEY"):
        raise RuntimeError("GEMINI_API_KEY is not set in your .env file")
    print("Server started — Gemini client ready")
    yield
    print("Server shutting down")


# ── App ────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Financial Advisory Pipeline API",
    description="Runs financial planning personas through four context engineering variants",
    version="1.0.0",
    lifespan=lifespan,
)


# ── CORS ───────────────────────────────────────────────────────────────────
# CORS (Cross-Origin Resource Sharing) allows the React frontend, which runs
# on a different port (5173), to make requests to this backend (8000).
# Without this, the browser would block every request.
# In production you replace "*" with your actual deployed frontend URL.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response schemas ─────────────────────────────────────────────
# Pydantic models define exactly what shape of data the API accepts and
# returns. FastAPI automatically validates incoming requests against these
# and returns a clear error if something is wrong.

class PersonaRequest(BaseModel):
    persona: str

    class Config:
        json_schema_extra = {
            "example": {
                "persona": "28-year-old, entry-level salary, renting in San Francisco, $25k in student loans"
            }
        }


class PipelineResponse(BaseModel):
    variant: str
    persona: str
    duration_seconds: float
    result: dict


class ProseResponse(BaseModel):
    variant: str
    persona: str
    duration_seconds: float
    result: str


# ── Helper: run blocking code without freezing the server ──────────────────
# asyncio.to_thread() takes a regular (blocking) function and runs it in a
# separate thread so the async event loop stays free to handle other
# requests. This is how we get concurrency without rewriting all agent code.

async def run_in_thread(fn, *args):
    return await asyncio.to_thread(fn, *args)


# ── Routes ─────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    """Health check — confirms the server is running."""
    return {"status": "ok", "message": "Financial Advisory API is running"}


@app.post("/run/variant-a", response_model=ProseResponse)
async def run_variant_a_endpoint(request: PersonaRequest):
    """
    Variant A: Simple prompt.
    Sends the persona directly to Gemini with no grounding documents
    and no pipeline. Returns plain prose.
    """
    start = time.time()
    try:
        result = await run_in_thread(run_variant_a, request.persona)
        return ProseResponse(
            variant="variant_a_simple_prompt",
            persona=request.persona,
            duration_seconds=round(time.time() - start, 2),
            result=result["response"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/run/variant-b", response_model=ProseResponse)
async def run_variant_b_endpoint(request: PersonaRequest):
    """
    Variant B: Grounded contextualization.
    Sends the persona to Gemini with heuristics.md and biases.md
    injected into the system prompt. Returns plain prose.
    """
    start = time.time()
    try:
        result = await run_in_thread(run_variant_b, request.persona)
        return ProseResponse(
            variant="variant_b_grounded",
            persona=request.persona,
            duration_seconds=round(time.time() - start, 2),
            result=result["response"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/run/sequential", response_model=PipelineResponse)
async def run_sequential_endpoint(request: PersonaRequest):
    """
    Variant C: Sequential pipeline.
    Runs all four agents in order (Persona Profiler → Heuristic Strategist
    → Goal Optimizer → Quality Control). Returns the full structured JSON
    including all agent outputs and Agent 4's QC report.
    """
    start = time.time()
    try:
        result = await run_in_thread(run_pipeline, request.persona)
        return PipelineResponse(
            variant="sequential",
            persona=request.persona,
            duration_seconds=round(time.time() - start, 2),
            result=result,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/run/hierarchical", response_model=PipelineResponse)
async def run_hierarchical_endpoint(request: PersonaRequest):
    """
    Variant D: Hierarchical pipeline.
    An orchestrator agent decides whether to call the Heuristic Strategist
    (Agent 2) based on persona complexity. Returns the full structured JSON
    including routing decisions and all agent outputs.
    """
    start = time.time()
    try:
        result = await run_in_thread(run_hierarchical_pipeline, request.persona)
        return PipelineResponse(
            variant="hierarchical",
            persona=request.persona,
            duration_seconds=round(time.time() - start, 2),
            result=result,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))