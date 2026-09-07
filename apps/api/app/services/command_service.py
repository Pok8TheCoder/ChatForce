from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from analysis_engine.schemas.models import (
    CanvasObject,
    CanvasObjectType,
    Connection,
    Position,
    Size,
    WorkspaceState,
)


class CommandError(ValueError):
    pass


class CommandService:
    def apply(self, workspace: WorkspaceState, command: str, payload: dict[str, Any]) -> WorkspaceState:
        updated = deepcopy(workspace)
        handler = getattr(self, f"_handle_{command.lower()}", None)
        if handler is None:
            raise CommandError(f"Unknown command: {command}")
        handler(updated, payload)
        record = {
            "command": command,
            "payload": payload,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        updated.undo_stack.append(record)
        updated.redo_stack = []
        return updated

    def undo(self, workspace: WorkspaceState) -> WorkspaceState:
        if not workspace.undo_stack:
            raise CommandError("Nothing to undo")
        updated = deepcopy(workspace)
        updated.undo_stack.pop()
        # Full history replay is expensive; for MVP reload from last known good state
        # by replaying undo_stack minus last — simplified: caller should persist snapshots
        return updated

    def _get_object(self, workspace: WorkspaceState, object_id: str) -> CanvasObject:
        for obj in workspace.objects:
            if obj.id == object_id:
                return obj
        raise CommandError(f"Object not found: {object_id}")

    def _handle_move_object(self, workspace: WorkspaceState, payload: dict[str, Any]) -> None:
        obj = self._get_object(workspace, payload["object_id"])
        position = payload.get("position", {})
        obj.position = Position(x=position.get("x", obj.position.x), y=position.get("y", obj.position.y))

    def _handle_resize_object(self, workspace: WorkspaceState, payload: dict[str, Any]) -> None:
        obj = self._get_object(workspace, payload["object_id"])
        size = payload.get("size", {})
        obj.size = Size(
            width=size.get("width", obj.size.width),
            height=size.get("height", obj.size.height),
        )

    def _handle_create_object(self, workspace: WorkspaceState, payload: dict[str, Any]) -> None:
        obj_type = payload.get("type")
        if not obj_type:
            raise CommandError("type is required")
        try:
            canvas_type = CanvasObjectType(obj_type)
        except ValueError as exc:
            raise CommandError(f"Invalid object type: {obj_type}") from exc
        obj = CanvasObject(
            id=payload.get("id") or str(uuid4()),
            type=canvas_type,
            position=Position(**payload.get("position", {"x": 100, "y": 100})),
            size=Size(**payload.get("size", {"width": 280, "height": 180})),
            data=payload.get("data", {}),
        )
        workspace.objects.append(obj)

    def _handle_delete_object(self, workspace: WorkspaceState, payload: dict[str, Any]) -> None:
        object_id = payload["object_id"]
        workspace.objects = [o for o in workspace.objects if o.id != object_id]
        workspace.connections = [
            c for c in workspace.connections if c.source_id != object_id and c.target_id != object_id
        ]
        workspace.selected_object_ids = [i for i in workspace.selected_object_ids if i != object_id]

    def _handle_connect(self, workspace: WorkspaceState, payload: dict[str, Any]) -> None:
        source_id = payload["source_id"]
        target_id = payload["target_id"]
        if source_id == target_id:
            raise CommandError("Cannot connect object to itself")
        self._get_object(workspace, source_id)
        self._get_object(workspace, target_id)
        for conn in workspace.connections:
            if conn.source_id == source_id and conn.target_id == target_id:
                return
        workspace.connections.append(
            Connection(
                id=payload.get("id") or str(uuid4()),
                source_id=source_id,
                target_id=target_id,
                source_port=payload.get("source_port"),
                target_port=payload.get("target_port"),
                label=payload.get("label"),
            )
        )

    def _handle_disconnect(self, workspace: WorkspaceState, payload: dict[str, Any]) -> None:
        connection_id = payload.get("connection_id")
        if connection_id:
            workspace.connections = [c for c in workspace.connections if c.id != connection_id]
            return
        source_id = payload.get("source_id")
        target_id = payload.get("target_id")
        workspace.connections = [
            c
            for c in workspace.connections
            if not (c.source_id == source_id and c.target_id == target_id)
        ]

    def _handle_configure_chart(self, workspace: WorkspaceState, payload: dict[str, Any]) -> None:
        obj = self._get_object(workspace, payload["object_id"])
        if obj.type != CanvasObjectType.CHART:
            raise CommandError("Object is not a chart")
        config = payload.get("config", {})
        obj.data = {**obj.data, **config}

    def _handle_select_objects(self, workspace: WorkspaceState, payload: dict[str, Any]) -> None:
        workspace.selected_object_ids = payload.get("object_ids", [])

    def _handle_set_viewport(self, workspace: WorkspaceState, payload: dict[str, Any]) -> None:
        viewport = payload.get("viewport", {})
        workspace.viewport.x = viewport.get("x", workspace.viewport.x)
        workspace.viewport.y = viewport.get("y", workspace.viewport.y)
        workspace.viewport.zoom = viewport.get("zoom", workspace.viewport.zoom)
