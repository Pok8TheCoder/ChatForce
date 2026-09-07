from __future__ import annotations

from uuid import uuid4

from analysis_engine.schemas.models import WorkspaceState

from app.services.storage import StorageService


class WorkspaceService:
    def __init__(self, storage: StorageService | None = None) -> None:
        self.storage = storage or StorageService()

    def list_workspaces(self) -> list[dict]:
        return self.storage.list_workspaces()

    def create_workspace(self, title: str = "Untitled Workspace") -> WorkspaceState:
        workspace = WorkspaceState(id=str(uuid4()), title=title)
        self.save(workspace)
        return workspace

    def get_workspace(self, workspace_id: str) -> WorkspaceState | None:
        raw = self.storage.load_workspace_state(workspace_id)
        if raw is None:
            return None
        return WorkspaceState.model_validate(raw)

    def save(self, workspace: WorkspaceState) -> WorkspaceState:
        self.storage.save_workspace_state(workspace.id, workspace.model_dump(mode="json"))
        return workspace

    def delete_workspace(self, workspace_id: str) -> bool:
        return self.storage.delete_workspace(workspace_id)
