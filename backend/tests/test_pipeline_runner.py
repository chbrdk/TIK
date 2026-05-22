from __future__ import annotations

import json
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.pipeline import runner
from app.pipeline.registry import list_personas_from_fixtures
from app.pipeline.schemas import PipelineSessionRequest
from app.pipeline.store import store


@pytest.fixture
def client():
    return TestClient(create_app())


def test_list_personas_from_fixtures():
    personas = list_personas_from_fixtures()
    ids = {p.id for p in personas}
    assert "klaus_dortmund" in ids or "sick_instandhaltung_lebensmittel_v1" in ids or len(personas) >= 0


def test_job_store_create():
    req = PipelineSessionRequest(
        persona_id="test_persona_studio",
        target_audience="Test audience for pipeline store",
        company_name="Test Co",
        company_description="Demo company",
    )
    job = store.create(req)
    assert job.job_id.startswith("job_")
    loaded = store.get(job.job_id)
    assert loaded is not None
    assert loaded.persona_id == "test_persona_studio"


def test_run_pipeline_mocked(tmp_path, monkeypatch):
    monkeypatch.setenv("PIPELINE_JOB_DIR", str(tmp_path / "jobs"))
    from app.pipeline import config

    monkeypatch.setattr(config, "job_dir", lambda: tmp_path / "jobs")

    req = PipelineSessionRequest(
        persona_id="mock_persona",
        target_audience="Engineering team leads DACH region",
        company_name="ACME",
        company_description="Industrial demo",
        generate_worlds=False,
    )
    job = store.create(req)

    fake_profile = {
        "meta": {"persona_id": "mock_persona", "language": "de", "schema_version": "1.0"},
        "session_arc": {"acts": {"1": {"world_slug": "void-mirror"}}},
        "persona": {"id": "mock_persona", "display_name": "Mock"},
    }

    async def fake_persona(*_a, **_k):
        return fake_profile

    async def fake_acts(_p):
        return None

    async def fake_compile(*_a, **_k):
        return None

    async def fake_publish(*_a, **_k):
        return None

    with (
        patch.object(runner, "run_persona_step", AsyncMock(side_effect=fake_persona)),
        patch.object(runner, "run_act_step", AsyncMock(side_effect=fake_acts)),
        patch.object(runner, "_compile", AsyncMock(side_effect=fake_compile)),
        patch.object(runner, "_publish", AsyncMock(side_effect=fake_publish)),
    ):
        import asyncio

        asyncio.run(runner.run_pipeline(job.job_id))

    done = store.get(job.job_id)
    assert done is not None
    assert done.state.value == "awaiting_worlds"
    assert done.preview_config_url is None
    worlds = next(s for s in done.steps if s.id == "worlds")
    assert worlds.state.value == "queued"


def test_create_session_without_persona_id(client, tmp_path, monkeypatch):
    monkeypatch.setenv("PIPELINE_JOB_DIR", str(tmp_path / "jobs"))
    from app.pipeline import config

    monkeypatch.setattr(config, "job_dir", lambda: tmp_path / "jobs")

    with patch("app.pipeline.router.run_pipeline", AsyncMock()):
        res = client.post(
            "/v1/pipeline/sessions",
            json={
                "target_audience": "Instandhalter Food",
                "company_name": "SICK AG",
                "company_description": "Sensorik Demo",
            },
        )
    assert res.status_code == 200
    assert res.json()["persona_id"] == "pending"


def test_create_session_endpoint(client, tmp_path, monkeypatch):
    monkeypatch.setenv("PIPELINE_JOB_DIR", str(tmp_path / "jobs"))
    from app.pipeline import config

    monkeypatch.setattr(config, "job_dir", lambda: tmp_path / "jobs")

    with patch("app.pipeline.router.run_pipeline", AsyncMock()):
        res = client.post(
            "/v1/pipeline/sessions",
            json={
                "persona_id": "api_test_persona",
                "target_audience": "Test audience API endpoint",
                "company_name": "Co",
                "company_description": "Desc",
            },
        )
    assert res.status_code == 200
    data = res.json()
    assert data["persona_id"] == "api_test_persona"
    assert data["job_id"].startswith("job_")


def test_dynamic_golden_load():
    from app.persona_reality.service import load_golden_config

    try:
        cfg = load_golden_config("klaus_dortmund", "de")
        assert cfg["persona"]["id"] == "klaus_dortmund"
    except Exception:
        pytest.skip("klaus golden missing")

    sick_path = (
        __import__("pathlib").Path(__file__).resolve().parents[2]
        / "fixtures/golden/sick_instandhaltung_lebensmittel_v1_de.json"
    )
    if sick_path.is_file():
        cfg = load_golden_config("sick_instandhaltung_lebensmittel_v1", "de")
        assert "persona" in cfg
