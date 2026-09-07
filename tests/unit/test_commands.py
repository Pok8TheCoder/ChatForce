import pytest

from analysis_engine.schemas.models import CanvasObjectType, WorkspaceState
from app.services.command_service import CommandError, CommandService


@pytest.fixture
def workspace():
    return WorkspaceState(title="Test")


@pytest.fixture
def command_service():
    return CommandService()


def test_create_object(command_service, workspace):
    updated = command_service.apply(
        workspace,
        "CREATE_OBJECT",
        {"type": "chart", "position": {"x": 50, "y": 50}, "data": {"label": "Revenue"}},
    )
    assert len(updated.objects) == 1
    assert updated.objects[0].type == CanvasObjectType.CHART


def test_move_object(command_service, workspace):
    updated = command_service.apply(
        workspace,
        "CREATE_OBJECT",
        {"type": "kpi", "position": {"x": 0, "y": 0}},
    )
    obj_id = updated.objects[0].id
    moved = command_service.apply(
        updated,
        "MOVE_OBJECT",
        {"object_id": obj_id, "position": {"x": 200, "y": 300}},
    )
    assert moved.objects[0].position.x == 200
    assert moved.objects[0].position.y == 300


def test_connect_objects(command_service, workspace):
    ws = command_service.apply(
        workspace, "CREATE_OBJECT", {"type": "dataset", "position": {"x": 0, "y": 0}}
    )
    ws = command_service.apply(
        ws, "CREATE_OBJECT", {"type": "chart", "position": {"x": 300, "y": 0}}
    )
    dataset_id = ws.objects[0].id
    chart_id = ws.objects[1].id
    connected = command_service.apply(
        ws, "CONNECT", {"source_id": dataset_id, "target_id": chart_id}
    )
    assert len(connected.connections) == 1


def test_delete_object(command_service, workspace):
    ws = command_service.apply(
        workspace, "CREATE_OBJECT", {"type": "text", "position": {"x": 0, "y": 0}}
    )
    obj_id = ws.objects[0].id
    deleted = command_service.apply(ws, "DELETE_OBJECT", {"object_id": obj_id})
    assert len(deleted.objects) == 0


def test_unknown_command(command_service, workspace):
    with pytest.raises(CommandError):
        command_service.apply(workspace, "INVALID", {})
