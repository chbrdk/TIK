from __future__ import annotations

import json
import re
import time
import uuid
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.pipeline import runner
from app.pipeline.schemas import JobState

SESSION_BODY = {
    "target_audience": "Glasbau-Ingenieure und Fassadenplaner DACH, technisch-rational",
    "company_name": "Schott API Test",
    "company_description": "Spezialglas Messe-Demo für automatisierten Pipeline-Test.",
    "company_industry": "industrial_b2b",
    "language": "de",
    "generate_worlds": False,
}


@pytest.fixture
def client():
    return TestClient(create_app())


def test_api_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_api_list_personas(client):
    res = client.get("/v1/pipeline/personas")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    if data:
        row = data[0]
        assert "id" in row
        assert "published" in row
        assert "preview_config_url" in row
        assert "narrative_preview_acts" in row


def test_api_voiceover_audio_status(client, tmp_path, monkeypatch):
    import json

    monkeypatch.setenv("TIK_REPO_ROOT", str(tmp_path))
    from app.pipeline import config

    monkeypatch.setattr(config, "repo_root", lambda: tmp_path)

    persona_id = "schott_glasbau_ingenieur_v8"
    golden = tmp_path / "fixtures/golden"
    golden.mkdir(parents=True)
    (golden / f"{persona_id}_de.json").write_text(
        json.dumps({"persona": {"display_name": "Test"}}),
        encoding="utf-8",
    )
    narr = tmp_path / "fixtures/narrative"
    narr.mkdir(parents=True)
    (narr / f"{persona_id}_de.json").write_text(
        json.dumps({"voiceover_tracks": {"nova_de_act1_01": {"lines": [{"text": "Hi", "at_sec": 0}]}}}),
        encoding="utf-8",
    )

    res = client.get(f"/v1/pipeline/personas/{persona_id}/voiceover-audio")
    assert res.status_code == 200
    data = res.json()
    assert data["persona_id"] == persona_id
    assert len(data["tracks"]) == 1


def test_api_create_session_rejects_short_audience(client, pipeline_job_dir):
    res = client.post(
        "/v1/pipeline/sessions",
        json={
            "target_audience": "kurz",
            "company_name": "Co",
            "company_description": "Beschreibung mindestens vorhanden",
        },
    )
    assert res.status_code == 422


def test_api_create_session_returns_pending_persona(client, pipeline_job_dir):
    with patch("app.pipeline.router.run_pipeline", new_callable=AsyncMock):
        res = client.post("/v1/pipeline/sessions", json=SESSION_BODY)
    assert res.status_code == 200
    data = res.json()
    assert data["job_id"].startswith("job_")
    assert data["persona_id"] == "pending"
    assert data["state"] == "queued"
    assert len(data["steps"]) == 6


def test_api_list_jobs(client, pipeline_job_dir):
    with patch("app.pipeline.router.run_pipeline", new_callable=AsyncMock):
        created = client.post("/v1/pipeline/sessions", json=SESSION_BODY).json()
        res = client.get("/v1/pipeline/jobs")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    row = next((j for j in data if j["job_id"] == created["job_id"]), None)
    assert row is not None
    assert row["company_name"] == SESSION_BODY["company_name"]
    assert row["state"] in {s.value for s in JobState}
    assert "created_at" in row


def test_api_list_jobs_resolves_persona_from_step_message(client, pipeline_job_dir):
    from app.pipeline.schemas import JobState, JobStatus, JobStep, PipelineSessionRequest
    from app.pipeline.store import store

    job = store.create(
        PipelineSessionRequest(
            target_audience="Glasbau-Ingenieure DACH für Listen-Test",
            company_name="List Test AG",
            company_description="Prüft persona_id-Auflösung in der Job-Liste.",
        )
    )
    job.persona_id = "pending"
    job.steps = [
        JobStep(id="persona", label="Persona", state=JobState.COMPLETED, message="persona_id: list_test_v9"),
        JobStep(id="acts", label="Acts", state=JobState.QUEUED),
    ]
    store.update(job)

    row = next((j for j in client.get("/v1/pipeline/jobs").json() if j["job_id"] == job.job_id), None)
    assert row is not None
    assert row["persona_id"] == "list_test_v9"


def test_api_get_job_log(client, pipeline_job_dir):
    with patch("app.pipeline.router.run_pipeline", new_callable=AsyncMock):
        created = client.post("/v1/pipeline/sessions", json=SESSION_BODY).json()
    job_id = created["job_id"]
    log_res = client.get(f"/v1/pipeline/jobs/{job_id}/log")
    assert log_res.status_code == 200
    assert "Job created" in log_res.json()["log"]


def _make_claude_mock(schott_profile: dict, sick_acts: dict[int, dict], persona_id: str):
    async def fake_complete_json(system: str, user: str, **kwargs):
        if "act builder" in system.lower() or "act_blueprint" in system.lower():
            m = re.search(r"act\s+(\d)", user, re.I)
            act_num = int(m.group(1)) if m else 1
            bp = json.loads(json.dumps(sick_acts[act_num]))
            bp["meta"]["blueprint_id"] = f"{persona_id}_act_{act_num:02d}"
            return bp
        raw = {
            "persona": schott_profile["persona"],
            "company_context": schott_profile["company_context"],
            "session_arc": schott_profile["session_arc"],
            "act_data": schott_profile.get("act_data", {}),
            "meta": {"persona_id": persona_id, "display_title": "API Test"},
        }
        return raw

    return fake_complete_json


@pytest.mark.slow
def test_api_pipeline_e2e_mocked_claude(
    client,
    pipeline_job_dir,
    schott_profile,
    sick_act_blueprints,
    repo_root,
):
    """Full API flow: POST session → background pipeline → GET job completed (no Anthropic)."""
    persona_id = f"api_e2e_{uuid.uuid4().hex[:10]}"

    async def noop_compile(persona_id: str, lang: str, job_id: str) -> None:
        golden_dir = repo_root / "fixtures/golden"
        golden_dir.mkdir(parents=True, exist_ok=True)
        stub = {
            "meta": {
                "persona_id": persona_id,
                "language": lang,
                "schema_version": "1.0",
                "scene_id": "se_test",
            },
            "persona": {"id": persona_id, "display_name": "API Test"},
            "environments": [],
            "narrative_beats": [],
        }
        (golden_dir / f"{persona_id}_{lang}.json").write_text(
            json.dumps(stub, indent=2),
            encoding="utf-8",
        )

    async def noop_publish(persona_id: str, lang: str, job_id: str) -> None:
        pub = repo_root / "webxr/public/scene_configs"
        pub.mkdir(parents=True, exist_ok=True)
        src = repo_root / "fixtures/golden" / f"{persona_id}_{lang}.json"
        if src.is_file():
            (pub / f"{persona_id}_{lang}.json").write_text(
                src.read_text(encoding="utf-8"),
                encoding="utf-8",
            )

    claude_mock = _make_claude_mock(schott_profile, sick_act_blueprints, persona_id)

    with (
        patch("app.pipeline.claude.complete_json", claude_mock),
        patch.object(runner, "_compile", side_effect=noop_compile),
        patch.object(runner, "_publish", side_effect=noop_publish),
    ):
        body = {**SESSION_BODY, "persona_id": persona_id}
        res = client.post("/v1/pipeline/sessions", json=body)
        assert res.status_code == 200
        job_id = res.json()["job_id"]

        # TestClient runs background tasks after response
        for _ in range(50):
            job = client.get(f"/v1/pipeline/jobs/{job_id}").json()
            if job["state"] in ("completed", "failed"):
                break
            time.sleep(0.05)

    assert job["state"] == "completed", job.get("error") or job
    assert job["persona_id"] == persona_id
    assert job["preview_config_url"] == f"/scene_configs/{persona_id}_de.json"
    assert any(a["exists"] for a in job.get("artifacts", []))

    prof = repo_root / "fixtures/persona-profiles" / f"{persona_id}.json"
    assert prof.is_file()
    for n in range(1, 6):
        assert (repo_root / "fixtures/act-blueprints" / persona_id / f"act-0{n}.json").is_file()


def test_api_job_events_sse_first_chunk(client, pipeline_job_dir):
    from app.pipeline.store import store

    with patch("app.pipeline.router.run_pipeline", new_callable=AsyncMock):
        job_id = client.post("/v1/pipeline/sessions", json=SESSION_BODY).json()["job_id"]
    job = store.get(job_id)
    assert job is not None
    job.state = JobState.COMPLETED
    store.update(job)
    res = client.get(f"/v1/pipeline/jobs/{job_id}/events")
    assert res.status_code == 200
    assert "text/event-stream" in res.headers.get("content-type", "")
    assert "data:" in res.text
