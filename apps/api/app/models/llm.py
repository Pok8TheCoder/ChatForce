from __future__ import annotations

from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field


class LLMPreset(BaseModel):
    id: str
    name: str
    provider: str
    description: str
    base_url: str = ""
    default_model: str = ""
    requires_api_key: bool = False


class LLMConfig(BaseModel):
    preset_id: str = "none"
    provider: str = "none"
    base_url: str = ""
    api_key: str = ""
    model: str = ""
    enabled: bool = False


class LLMConfigUpdate(BaseModel):
    preset_id: str
    base_url: str | None = None
    api_key: str | None = None
    model: str | None = None


class LLMTestResult(BaseModel):
    ok: bool
    message: str
    model: str | None = None


class AgentRequest(BaseModel):
    message: str
    context: dict[str, Any] = Field(default_factory=dict)


class AgentResponse(BaseModel):
    message: str
    provider: str
    model: str | None = None


LLM_PRESETS: list[LLMPreset] = [
    LLMPreset(
        id="none",
        name="None (Deterministic)",
        provider="none",
        description="No external LLM — deterministic responses and tool execution only.",
    ),
    LLMPreset(
        id="ollama",
        name="Ollama (Local)",
        provider="ollama",
        description="Local models via Ollama on your machine.",
        base_url="http://localhost:11434",
        default_model="llama3.2",
    ),
    LLMPreset(
        id="lm-studio",
        name="LM Studio",
        provider="openai-compatible",
        description="Local OpenAI-compatible server from LM Studio.",
        base_url="http://localhost:1234/v1",
        default_model="local-model",
    ),
    LLMPreset(
        id="text-generation-webui",
        name="Text Generation WebUI",
        provider="openai-compatible",
        description="oobabooga text-generation-webui OpenAI extension.",
        base_url="http://localhost:5000/v1",
        default_model="",
    ),
    LLMPreset(
        id="openai",
        name="OpenAI",
        provider="openai-compatible",
        description="Official OpenAI API.",
        base_url="https://api.openai.com/v1",
        default_model="gpt-4o-mini",
        requires_api_key=True,
    ),
    LLMPreset(
        id="openrouter",
        name="OpenRouter",
        provider="openai-compatible",
        description="OpenRouter multi-model gateway (OpenAI-compatible).",
        base_url="https://openrouter.ai/api/v1",
        default_model="openai/gpt-4o-mini",
        requires_api_key=True,
    ),
    LLMPreset(
        id="groq",
        name="Groq",
        provider="openai-compatible",
        description="Groq fast inference (OpenAI-compatible).",
        base_url="https://api.groq.com/openai/v1",
        default_model="llama-3.3-70b-versatile",
        requires_api_key=True,
    ),
    LLMPreset(
        id="custom-openai",
        name="Custom OpenAI-Compatible",
        provider="openai-compatible",
        description="Any OpenAI-compatible endpoint — set your own base URL and model.",
        base_url="",
        default_model="",
        requires_api_key=False,
    ),
]


def get_preset(preset_id: str) -> LLMPreset | None:
    for preset in LLM_PRESETS:
        if preset.id == preset_id:
            return preset
    return None
