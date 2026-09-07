from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.llm import (
    AgentRequest,
    AgentResponse,
    LLMConfig,
    LLMConfigUpdate,
    LLM_PRESETS,
    LLMTestResult,
    get_preset,
)
from app.services.llm_client import LLMClient, build_config_from_preset
from app.services.settings_store import SettingsStore

router = APIRouter(prefix="/api/llm", tags=["llm"])
settings_store = SettingsStore()

AGENT_SYSTEM_PROMPT = """You are InsightForge's analytical workspace assistant.
Use tools for canvas changes when available. Do not invent data or numerical results.
Prefer editing existing objects over creating duplicates. Explain completed actions briefly.
If you cannot perform an action yet, say what the user can do manually on the canvas."""


@router.get("/presets")
def list_presets() -> list[dict]:
    return [p.model_dump() for p in LLM_PRESETS]


@router.get("/config")
def get_config() -> dict:
    raw = settings_store.get_llm_config()
    config = LLMConfig(**raw)
    return {
        **config.model_dump(),
        "api_key_set": bool(config.api_key),
        "api_key": "***" if config.api_key else "",
    }


@router.put("/config")
def update_config(body: LLMConfigUpdate) -> dict:
    preset = get_preset(body.preset_id)
    if preset is None:
        raise HTTPException(status_code=400, detail=f"Unknown preset: {body.preset_id}")

    existing = settings_store.get_llm_config()
    api_key = body.api_key if body.api_key is not None else existing.get("api_key", "")
    if body.api_key == "":
        api_key = ""

    config = build_config_from_preset(
        body.preset_id,
        base_url=body.base_url,
        api_key=api_key,
        model=body.model,
    )
    settings_store.save_llm_config(config.model_dump())
    return {
        **config.model_dump(),
        "api_key_set": bool(config.api_key),
        "api_key": "***" if config.api_key else "",
    }


@router.post("/test", response_model=LLMTestResult)
async def test_connection() -> LLMTestResult:
    raw = settings_store.get_llm_config()
    config = LLMConfig(**raw)
    client = LLMClient(config)
    ok, message, model = await client.test_connection()
    return LLMTestResult(ok=ok, message=message, model=model)


@router.post("/chat", response_model=AgentResponse)
async def chat(body: AgentRequest) -> AgentResponse:
    raw = settings_store.get_llm_config()
    config = LLMConfig(**raw)
    client = LLMClient(config)
    reply = await client.chat(
        [{"role": "user", "content": body.message}],
        system=AGENT_SYSTEM_PROMPT,
    )
    return AgentResponse(
        message=reply,
        provider=config.provider,
        model=config.model or None,
    )
