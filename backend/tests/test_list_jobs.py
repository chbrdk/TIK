from __future__ import annotations

from app.pipeline.schemas import JobState, JobStep, PipelineSessionRequest
from app.pipeline.store import store


def test_store_list_jobs_sorted_newest_first(pipeline_job_dir):
    a = store.create(
        PipelineSessionRequest(
            target_audience="Zielgruppe A für Sortier-Test DACH",
            company_name="Company A",
            company_description="Erster Job.",
        )
    )
    b = store.create(
        PipelineSessionRequest(
            target_audience="Zielgruppe B für Sortier-Test DACH",
            company_name="Company B",
            company_description="Zweiter Job.",
        )
    )
    items = store.list_jobs()
    ids = [i.job_id for i in items]
    assert a.job_id in ids
    assert b.job_id in ids
    assert ids.index(b.job_id) < ids.index(a.job_id)
