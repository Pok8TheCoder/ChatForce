from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.config import settings


class StorageService:
    def __init__(self, base_dir: Path | None = None) -> None:
        self.base_dir = base_dir or settings.data_dir
        self.runtime_dir = self.base_dir / "runtime"
        self.samples_dir = self.base_dir / "samples"
        self.runtime_dir.mkdir(parents=True, exist_ok=True)
        self.samples_dir.mkdir(parents=True, exist_ok=True)

    def workspace_dir(self, workspace_id: str) -> Path:
        path = self.runtime_dir / workspace_id
        path.mkdir(parents=True, exist_ok=True)
        for sub in ("original", "cleaned", "analysis", "workspace", "exports"):
            (path / sub).mkdir(exist_ok=True)
        return path

    def workspace_state_path(self, workspace_id: str) -> Path:
        return self.workspace_dir(workspace_id) / "workspace" / "workspace.json"

    def workspace_manifest_path(self, workspace_id: str) -> Path:
        return self.workspace_dir(workspace_id) / "manifest.json"

    def list_workspaces(self) -> list[dict[str, Any]]:
        workspaces: list[dict[str, Any]] = []
        if not self.runtime_dir.exists():
            return workspaces
        for entry in sorted(self.runtime_dir.iterdir()):
            if not entry.is_dir():
                continue
            manifest = self._read_json(entry / "manifest.json")
            state = self._read_json(entry / "workspace" / "workspace.json")
            title = (
                (state or {}).get("title")
                or (manifest or {}).get("title")
                or "Untitled Workspace"
            )
            workspaces.append(
                {
                    "id": entry.name,
                    "title": title,
                    "updated_at": (manifest or {}).get("updated_at"),
                }
            )
        workspaces.sort(key=lambda w: w.get("updated_at") or "", reverse=True)
        return workspaces

    def save_workspace_state(self, workspace_id: str, state: dict[str, Any]) -> None:
        path = self.workspace_state_path(workspace_id)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(state, indent=2), encoding="utf-8")
        manifest_path = self.workspace_manifest_path(workspace_id)
        manifest = self._read_json(manifest_path) or {"id": workspace_id}
        manifest["title"] = state.get("title", manifest.get("title", "Untitled Workspace"))
        manifest["updated_at"] = datetime.now(timezone.utc).isoformat()
        manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    def load_workspace_state(self, workspace_id: str) -> dict[str, Any] | None:
        return self._read_json(self.workspace_state_path(workspace_id))

    def delete_workspace(self, workspace_id: str) -> bool:
        path = self.runtime_dir / workspace_id
        if not path.exists():
            return False
        import shutil

        shutil.rmtree(path)
        return True

    def dataset_original_dir(self, workspace_id: str, dataset_id: str) -> Path:
        path = self.workspace_dir(workspace_id) / "original" / dataset_id
        path.mkdir(parents=True, exist_ok=True)
        return path

    def dataset_cleaned_dir(self, workspace_id: str, dataset_id: str) -> Path:
        path = self.workspace_dir(workspace_id) / "cleaned" / dataset_id
        path.mkdir(parents=True, exist_ok=True)
        return path

    def dataset_analysis_dir(self, workspace_id: str, dataset_id: str) -> Path:
        path = self.workspace_dir(workspace_id) / "analysis" / dataset_id
        path.mkdir(parents=True, exist_ok=True)
        return path

    @staticmethod
    def _read_json(path: Path) -> dict[str, Any] | None:
        if not path.exists():
            return None
        return json.loads(path.read_text(encoding="utf-8"))
