from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.config import settings


class SettingsStore:
    def __init__(self, path: Path | None = None) -> None:
        self.path = path or settings.data_dir / "runtime" / "app_settings.json"
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def load(self) -> dict[str, Any]:
        if not self.path.exists():
            return {}
        return json.loads(self.path.read_text(encoding="utf-8"))

    def save(self, data: dict[str, Any]) -> None:
        self.path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    def get_llm_config(self) -> dict[str, Any]:
        stored = self.load().get("llm", {})
        return {
            "preset_id": stored.get("preset_id", settings.llm_provider if settings.llm_provider != "none" else "none"),
            "provider": stored.get("provider", settings.llm_provider),
            "base_url": stored.get("base_url", settings.llm_base_url or settings.ollama_base_url),
            "api_key": stored.get("api_key", settings.llm_api_key),
            "model": stored.get("model", settings.llm_model or settings.ollama_model),
            "enabled": stored.get("enabled", settings.llm_provider != "none"),
        }

    def save_llm_config(self, config: dict[str, Any]) -> None:
        data = self.load()
        data["llm"] = config
        self.save(data)
