from __future__ import annotations

import json

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.pipeline.schemas import JobState, JobStep, PipelineSessionRequest
from app.pipeline.store import store


@pytest.fixture
def client():
    return TestClient(create_app())


def test_persona_acts_creative_endpoint(client, repo_root):
    persona_id = "schott_glasbau_ingenieur_v8"
    prof = repo_root / "fixtures/persona-profiles" / f"{persona_id}.json"
    if not prof.is_file():
        pytest.skip("schott v4 missing")
    res = client.get(f"/v1/pipeline/personas/{persona_id}/acts")
    assert res.status_code == 200
    data = res.json()
    assert data["persona_id"] == persona_id
    assert len(data["acts"]) == 5
    act2 = next(a for a in data["acts"] if a["act"] == 2)
    assert act2["exists"] is True
    assert act2.get("prompt_en")
    assert len(act2.get("voiceover_lines", [])) >= 1
    assert act2.get("world_prompt_resolved")
    assert "act_blueprint" in (act2.get("world_prompt_source") or "")


def test_job_acts_creative_endpoint(client, pipeline_job_dir, repo_root):
    persona_id = "schott_glasbau_ingenieur_v8"
    if not (repo_root / "fixtures/act-blueprints" / persona_id).is_dir():
        pytest.skip("schott v4 acts missing")

    job = store.create(
        PipelineSessionRequest(
            target_audience="Glasbau-Ingenieure DACH Act-API-Test",
            company_name="Schott",
            company_description="Act creative API test.",
        )
    )
    j = store.get(job.job_id)
    assert j is not None
    j.persona_id = persona_id
    j.steps = [
        JobStep(id="persona", label="P", state=JobState.COMPLETED, message=f"persona_id: {persona_id}"),
        JobStep(id="acts", label="A", state=JobState.COMPLETED),
    ]
    store.update(j)

    res = client.get(f"/v1/pipeline/jobs/{job.job_id}/acts")
    assert res.status_code == 200
    assert res.json()["acts"][1]["voiceover_lines"][0]["text"]


def test_job_acts_creative_pending_400(client, pipeline_job_dir):
    job = store.create(
        PipelineSessionRequest(
            target_audience="Glasbau-Ingenieure DACH pending test",
            company_name="Co",
            company_description="Pending act API.",
        )
    )
    res = client.get(f"/v1/pipeline/jobs/{job.job_id}/acts")
    assert res.status_code == 400
