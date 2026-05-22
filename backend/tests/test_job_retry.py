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


def test_retry_failed_job_from_acts(client, pipeline_job_dir):
    with patch("app.pipeline.router.run_pipeline", new_callable=AsyncMock):
        created = client.post("/v1/pipeline/sessions", json=SESSION_BODY).json()
    job_id = created["job_id"]
    job = store.get(job_id)
    assert job is not None
    job.persona_id = "schott_glasbau_ingenieur_v8"
    job.state = JobState.FAILED
    job.error = "Act 1 validation failed"
    for step in job.steps:
        if step.id == "persona":
            step.state = JobState.COMPLETED
        elif step.id == "acts":
            step.state = JobState.FAILED
        else:
            step.state = JobState.QUEUED
    store.update(job)

    with patch("app.pipeline.router.run_pipeline_retry", new_callable=AsyncMock) as mock_retry:
        res = client.post(f"/v1/pipeline/jobs/{job_id}/retry", json={"from_step": "auto"})
    assert res.status_code == 200
    mock_retry.assert_called_once()
    assert mock_retry.call_args[0][1] == "acts"


def test_retry_rejects_running_job(client, pipeline_job_dir):
    with patch("app.pipeline.router.run_pipeline", new_callable=AsyncMock):
        created = client.post("/v1/pipeline/sessions", json=SESSION_BODY).json()
    job_id = created["job_id"]
    job = store.get(job_id)
    job.state = JobState.ACTS
    store.update(job)
    res = client.post(f"/v1/pipeline/jobs/{job_id}/retry")
    assert res.status_code == 409
