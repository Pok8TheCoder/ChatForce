from __future__ import annotations

from fastapi import APIRouter, HTTPException

from analysis_engine.schemas.models import (
    ApplyCommandRequest,
    ApplyCommandResponse,
    CreateWorkspaceRequest,
    WorkspaceState,
    WorkspaceSummary,
)
from app.services.command_service import CommandError, CommandService
from app.services.workspace_service import WorkspaceService

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])
workspace_service = WorkspaceService()
command_service = CommandService()


@router.get("", response_model=list[WorkspaceSummary])
def list_workspaces() -> list[WorkspaceSummary]:
    return [WorkspaceSummary(**item) for item in workspace_service.list_workspaces()]


@router.post("", response_model=WorkspaceState)
def create_workspace(body: CreateWorkspaceRequest) -> WorkspaceState:
    return workspace_service.create_workspace(title=body.title)


@router.get("/{workspace_id}", response_model=WorkspaceState)
def get_workspace(workspace_id: str) -> WorkspaceState:
    workspace = workspace_service.get_workspace(workspace_id)
    if workspace is None:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


@router.put("/{workspace_id}", response_model=WorkspaceState)
def update_workspace(workspace_id: str, body: WorkspaceState) -> WorkspaceState:
    if body.id != workspace_id:
        raise HTTPException(status_code=400, detail="Workspace id mismatch")
    return workspace_service.save(body)


@router.delete("/{workspace_id}")
def delete_workspace(workspace_id: str) -> dict[str, bool]:
    deleted = workspace_service.delete_workspace(workspace_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return {"deleted": True}


@router.post("/{workspace_id}/commands", response_model=ApplyCommandResponse)
def apply_command(workspace_id: str, body: ApplyCommandRequest) -> ApplyCommandResponse:
    workspace = workspace_service.get_workspace(workspace_id)
    if workspace is None:
        raise HTTPException(status_code=404, detail="Workspace not found")
    try:
        updated = command_service.apply(workspace, body.command, body.payload)
    except CommandError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    workspace_service.save(updated)
    return ApplyCommandResponse(
        workspace=updated,
        can_undo=len(updated.undo_stack) > 0,
        can_redo=len(updated.redo_stack) > 0,
    )
