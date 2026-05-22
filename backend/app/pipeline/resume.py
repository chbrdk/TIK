from __future__ import annotations

import json
from pathlib import Path

from .config import repo_root
from .finalize import run_finalize_worlds
from .runner import (
    _compile,
    _load_profile,
    _run_acts_through_publish,
    _run_from_persona,
)
from .schemas import JobState
from .store import store

STEP_ORDER = ("persona", "acts", "narrative", "compile", "worlds", "publish")
_RUNNING = {
    JobState.PERSONA,
    JobState.ACTS,
    JobState.NARRATIVE,
    JobState.COMPILE,
    JobState.WORLDS,
    JobState.PUBLISH,
}


def _step_index(step_id: str) -> int:
    try:
        return STEP_ORDER.index(step_id)
    except ValueError:
        return 0


def detect_retry_step(job) -> str:
    if job.state == JobState.AWAITING_WORLDS:
        return "worlds"
    if job.state == JobState.COMPLETED:
        return "worlds"
    for step_id in STEP_ORDER:
        step = next((s for s in job.steps if s.id == step_id), None)
        if step and step.state == JobState.FAILED:
            return step_id
    for step_id in STEP_ORDER:
        step = next((s for s in job.steps if s.id == step_id), None)
        if step and step.state not in (JobState.COMPLETED, JobState.QUEUED):
            if job.state == JobState.FAILED:
                return step_id
    return "persona"


def reset_steps_from(job_id: str, from_step: str) -> None:
    job = store.get(job_id)
    if not job:
        return
    start = _step_index(from_step)
    job.error = None
    for i, step in enumerate(job.steps):
        sid = step.id
        if sid not in STEP_ORDER:
            continue
        if _step_index(sid) < start:
            continue
        step.state = JobState.QUEUED
        step.message = None
    store.update(job)


def _profile_path(persona_id: str) -> Path:
    return repo_root() / "fixtures/persona-profiles" / f"{persona_id}.json"


async def run_pipeline_retry(job_id: str, from_step: str = "auto") -> None:
    job = store.get(job_id)
    if not job:
        return

    if job.state in _RUNNING:
        store.append_log(job_id, f"Retry abgebrochen: Job läuft noch ({job.state.value})")
        return

    step = from_step if from_step != "auto" else detect_retry_step(job)
    if step == "full":
        step = "persona"

    if step == "worlds":
        reset_steps_from(job_id, "worlds")
        store.append_log(job_id, "Retry: Welten generieren + Publish")
        await run_finalize_worlds(job_id)
        return

    reset_steps_from(job_id, step)
    store.append_log(job_id, f"Retry ab Schritt: {step}")
    store.set_state(job_id, JobState.QUEUED if step == "persona" else JobState.ACTS)

    req = job.request
    lang = req.language
    persona_id = job.persona_id if job.persona_id != "pending" else None
    profile = None

    if step != "persona" and persona_id and _profile_path(persona_id).is_file():
        profile = _load_profile(persona_id)
    elif step != "persona":
        store.append_log(job_id, "Retry: Persona-Profil fehlt — starte ab Persona")
        step = "persona"

    try:
        if step == "persona":
            profile, persona_id = await _run_from_persona(job_id, req, lang)
        else:
            assert profile is not None and persona_id
            store.set_persona_id(job_id, persona_id)

        await _run_acts_through_publish(
            job_id,
            persona_id,
            profile,
            req,
            lang,
            start_after_step=None if step == "persona" else step,
        )
    except Exception as e:
        store.append_log(job_id, f"FAILED: {e}")
        job = store.get(job_id)
        if job:
            job.error = str(e)
            for st in job.steps:
                if st.state not in (JobState.COMPLETED, JobState.QUEUED):
                    st.state = JobState.FAILED
            store.set_state(job_id, JobState.FAILED, error=str(e))
            if job.persona_id and job.persona_id != "pending":
                store.refresh_artifacts(job_id)
