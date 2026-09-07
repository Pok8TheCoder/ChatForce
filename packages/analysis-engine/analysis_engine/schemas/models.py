from __future__ import annotations

from enum import Enum
from typing import Any, Literal
from uuid import uuid4

from pydantic import BaseModel, Field


class CanvasObjectType(str, Enum):
    DATASET = "dataset"
    CHART = "chart"
    KPI = "kpi"
    INSIGHT = "insight"
    TABLE = "table"
    FILTER = "filter"
    SUMMARY = "summary"
    TEXT = "text"
    COMMENT = "comment"
    GROUP = "group"


class Position(BaseModel):
    x: float = 0
    y: float = 0


class Size(BaseModel):
    width: float = 280
    height: float = 180


class Viewport(BaseModel):
    x: float = 0
    y: float = 0
    zoom: float = 1


class CanvasObject(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    type: CanvasObjectType
    position: Position = Field(default_factory=Position)
    size: Size = Field(default_factory=Size)
    z_index: int = 0
    locked: bool = False
    data: dict[str, Any] = Field(default_factory=dict)


class Connection(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    source_id: str
    target_id: str
    source_port: str | None = None
    target_port: str | None = None
    route: list[Position] = Field(default_factory=list)
    label: str | None = None


class CommentStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    IGNORED = "ignored"


class Comment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    object_id: str | None = None
    position: Position = Field(default_factory=Position)
    text: str = ""
    status: CommentStatus = CommentStatus.OPEN


class CommandRecord(BaseModel):
    command: str
    payload: dict[str, Any] = Field(default_factory=dict)
    timestamp: str | None = None


class WorkspaceState(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str = "Untitled Workspace"
    objects: list[CanvasObject] = Field(default_factory=list)
    connections: list[Connection] = Field(default_factory=list)
    comments: list[Comment] = Field(default_factory=list)
    viewport: Viewport = Field(default_factory=Viewport)
    selected_object_ids: list[str] = Field(default_factory=list)
    undo_stack: list[CommandRecord] = Field(default_factory=list)
    redo_stack: list[CommandRecord] = Field(default_factory=list)


class WorkspaceSummary(BaseModel):
    id: str
    title: str
    updated_at: str | None = None


class AgentCommand(BaseModel):
    command: str
    payload: dict[str, Any] = Field(default_factory=dict)


class CreateWorkspaceRequest(BaseModel):
    title: str = "Untitled Workspace"


class ApplyCommandRequest(BaseModel):
    command: str
    payload: dict[str, Any] = Field(default_factory=dict)


class ApplyCommandResponse(BaseModel):
    workspace: WorkspaceState
    can_undo: bool
    can_redo: bool


CommandName = Literal[
    "MOVE_OBJECT",
    "RESIZE_OBJECT",
    "CREATE_OBJECT",
    "DELETE_OBJECT",
    "CONNECT",
    "DISCONNECT",
    "CONFIGURE_CHART",
    "SELECT_OBJECTS",
    "SET_VIEWPORT",
]
