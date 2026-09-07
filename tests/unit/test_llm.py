from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_list_llm_presets():
    response = client.get("/api/llm/presets")
    assert response.status_code == 200
    presets = response.json()
    assert len(presets) >= 5
    ids = {p["id"] for p in presets}
    assert "none" in ids
    assert "ollama" in ids
    assert "openai" in ids
    assert "lm-studio" in ids
    assert "text-generation-webui" in ids


def test_update_llm_config_ollama():
    response = client.put(
        "/api/llm/config",
        json={
            "preset_id": "ollama",
            "base_url": "http://localhost:11434",
            "model": "llama3.2",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["preset_id"] == "ollama"
    assert data["provider"] == "ollama"
    assert data["enabled"] is True


def test_llm_chat_deterministic():
    client.put("/api/llm/config", json={"preset_id": "none"})
    response = client.post("/api/llm/chat", json={"message": "Hello"})
    assert response.status_code == 200
    data = response.json()
    assert data["provider"] == "none"
    assert len(data["message"]) > 0
