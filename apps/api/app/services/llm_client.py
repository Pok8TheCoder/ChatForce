from __future__ import annotations

from typing import Any

import httpx

from app.models.llm import LLMConfig, get_preset


class LLMClient:
    def __init__(self, config: LLMConfig) -> None:
        self.config = config

    @property
    def is_enabled(self) -> bool:
        return self.config.provider != "none" and self.config.enabled

    async def chat(self, messages: list[dict[str, str]], system: str | None = None) -> str:
        if not self.is_enabled or self.config.provider == "none":
            return self._deterministic_reply(messages)

        all_messages: list[dict[str, str]] = []
        if system:
            all_messages.append({"role": "system", "content": system})
        all_messages.extend(messages)

        if self.config.provider == "ollama":
            return await self._chat_ollama(all_messages)
        if self.config.provider == "openai-compatible":
            return await self._chat_openai_compatible(all_messages)
        return self._deterministic_reply(messages)

    async def test_connection(self) -> tuple[bool, str, str | None]:
        if self.config.provider == "none":
            return True, "Deterministic mode — no external LLM required.", None

        try:
            reply = await self.chat(
                [{"role": "user", "content": "Reply with exactly: OK"}],
                system="You are a connection test. Reply briefly.",
            )
            model = self.config.model or None
            return True, f"Connected successfully. Response: {reply[:120]}", model
        except Exception as exc:
            return False, str(exc), None

    async def _chat_ollama(self, messages: list[dict[str, str]]) -> str:
        base = (self.config.base_url or "http://localhost:11434").rstrip("/")
        model = self.config.model or "llama3.2"
        payload = {"model": model, "messages": messages, "stream": False}
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(f"{base}/api/chat", json=payload)
            response.raise_for_status()
            data = response.json()
            return data.get("message", {}).get("content", "") or str(data)

    async def _chat_openai_compatible(self, messages: list[dict[str, str]]) -> str:
        base = self.config.base_url.rstrip("/")
        if not base:
            raise ValueError("Base URL is required for OpenAI-compatible providers")
        model = self.config.model or "gpt-4o-mini"
        headers: dict[str, str] = {"Content-Type": "application/json"}
        if self.config.api_key:
            headers["Authorization"] = f"Bearer {self.config.api_key}"

        payload = {"model": model, "messages": messages, "temperature": 0.2}
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(f"{base}/chat/completions", json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    def _deterministic_reply(self, messages: list[dict[str, str]]) -> str:
        last = messages[-1]["content"] if messages else ""
        lower = last.lower()
        if "analyze" in lower and "dataset" in lower:
            return "Use the Analyze Automatically action on the dataset object, or upload data first."
        if "connect" in lower or "link" in lower:
            return "Use the Connect or Arrow tool in the toolbar, then click source and target objects."
        if "clean" in lower and "workspace" in lower:
            return "Workspace cleanup will use auto-arrange once spatial tools are fully wired."
        return (
            "I'm running in deterministic mode (no LLM connected). "
            "Configure a provider in the agent panel — try Ollama, LM Studio, or OpenAI-compatible."
        )


def build_config_from_preset(
    preset_id: str,
    base_url: str | None = None,
    api_key: str | None = None,
    model: str | None = None,
) -> LLMConfig:
    preset = get_preset(preset_id)
    if preset is None:
        raise ValueError(f"Unknown preset: {preset_id}")

    resolved_base = base_url if base_url is not None else preset.base_url
    resolved_model = model if model is not None else preset.default_model

    return LLMConfig(
        preset_id=preset_id,
        provider=preset.provider,
        base_url=resolved_base,
        api_key=api_key or "",
        model=resolved_model,
        enabled=preset.provider != "none",
    )
