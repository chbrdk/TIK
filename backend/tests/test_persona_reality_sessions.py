from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_compose_session_klaus_de_returns_201_and_valid_schema():
    response = client.post(
        "/v1/sessions",
        json={"persona_id": "klaus_dortmund", "language": "de"},
    )
    assert response.status_code == 201, response.text
    data = response.json()

    assert data["meta"]["persona_id"] == "klaus_dortmund"
    assert data["meta"]["language"] == "de"
    assert data["meta"]["schema_version"] == "1.0"
    assert data["meta"]["scene_id"].startswith("se_")
    assert len(data["environments"]) == 5
    assert len(data["narrative_beats"]) >= 5
    assert data["persona"]["display_name"] == "Klaus Berger"
    assert data["data_layers"]["echeon"]["feed_items"]
    assert data["data_layers"]["checkion"]["metrics"]


def test_compose_session_unknown_persona_404():
    response = client.post(
        "/v1/sessions",
        json={"persona_id": "unknown_persona", "language": "de"},
    )
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "persona_not_found"


def test_get_session_after_compose():
    created = client.post(
        "/v1/sessions",
        json={"persona_id": "klaus_dortmund", "language": "de"},
    )
    scene_id = created.json()["meta"]["scene_id"]

    fetched = client.get(f"/v1/sessions/{scene_id}")
    assert fetched.status_code == 200
    assert fetched.json()["meta"]["scene_id"] == scene_id


def test_list_personas_includes_klaus():
    response = client.get("/v1/personas")
    assert response.status_code == 200
    assert any(p["id"] == "klaus_dortmund" for p in response.json())


def test_health():
    assert client.get("/health").json() == {"status": "ok"}
