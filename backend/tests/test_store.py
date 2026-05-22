from __future__ import annotations

from app.pipeline.schemas import PipelineSessionRequest
from app.pipeline.store import store


def test_set_persona_id_persists_before_refresh(pipeline_job_dir):
    req = PipelineSessionRequest(
        target_audience="Glasbau-Ingenieure DACH für Store-Test",
        company_name="Store Test GmbH",
        company_description="Prüft dass persona_id nach set_persona_id auf Disk steht.",
    )
    job = store.create(req)
    store.set_persona_id(job.job_id, "store_test_persona_v1")
    reloaded = store.get(job.job_id)
    assert reloaded is not None
    assert reloaded.persona_id == "store_test_persona_v1"
    assert reloaded.request.persona_id == "store_test_persona_v1"
