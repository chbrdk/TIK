from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.pipeline.schemas import JobState
from app.pipeline.store import store

SESSION_BODY = {
    "target_audience": "Glasbau-Ingenieure und Fassadenplaner DACH, technisch-rational",
    "company_name": "Schott API Test",
    "company_description": "Spezialglas Messe-Demo für automatisierten Pipeline-Test.",
    "language": "de",
    "generate_worlds": False,
}


@pytest.fixture
def client():
    return TestClient(create_app())


def test_generate_worlds_endpoint_requires_awaiting_state(client, pipeline_job_dir):
    with patch("app.pipeline.router.run_pipeline", new_callable=AsyncMock):
        created = client.post("/v1/pipeline/sessions", json=SESSION_BODY).json()
    job_id = created["job_id"]
    job = store.get(job_id)
    assert job is not None
    job.persona_id = "schott_glasbau_ingenieur_v8"
    job.state = JobState.AWAITING_WORLDS
    for step in job.steps:
        if step.id == "compile":
            step.state = JobState.COMPLETED
    store.update(job)

    with patch("app.pipeline.router.run_finalize_worlds", new_callable=AsyncMock):
        res = client.post(f"/v1/pipeline/jobs/{job_id}/generate-worlds")
    assert res.status_code == 200
    assert res.json()["state"] == "worlds"


def test_generate_worlds_rejects_queued_job(client, pipeline_job_dir):
    with patch("app.pipeline.router.run_pipeline", new_callable=AsyncMock):
        created = client.post("/v1/pipeline/sessions", json=SESSION_BODY).json()
    res = client.post(f"/v1/pipeline/jobs/{created['job_id']}/generate-worlds")
    assert res.status_code == 400
