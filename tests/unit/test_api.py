import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_create_and_get_workspace():
    create = client.post("/api/workspaces", json={"title": "Test Workspace"})
    assert create.status_code == 200
    workspace = create.json()
    assert workspace["title"] == "Test Workspace"
    assert workspace["objects"] == []

    get = client.get(f"/api/workspaces/{workspace['id']}")
    assert get.status_code == 200
    assert get.json()["id"] == workspace["id"]


def test_apply_create_object_command():
    create = client.post("/api/workspaces", json={"title": "Command Test"})
    workspace_id = create.json()["id"]

    cmd = client.post(
        f"/api/workspaces/{workspace_id}/commands",
        json={
            "command": "CREATE_OBJECT",
            "payload": {
                "type": "dataset",
                "position": {"x": 100, "y": 100},
                "data": {"label": "Sales", "empty": True},
            },
        },
    )
    assert cmd.status_code == 200
    result = cmd.json()
    assert len(result["workspace"]["objects"]) == 1
    assert result["workspace"]["objects"][0]["type"] == "dataset"


def test_list_workspaces():
    response = client.get("/api/workspaces")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
