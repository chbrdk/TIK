from __future__ import annotations

import json

from .config import repo_root
from .runner import _publish
from .schemas import JobState
from .store import store
from .worlds_step import collect_world_slugs, run_worlds_step


async def run_finalize_worlds(job_id: str) -> None:
    """Marble worlds + WebXR publish after user approved scene previews in Admin."""
    job = store.get(job_id)
    if not job:
        return
    persona_id = job.persona_id
    if not persona_id or persona_id == "pending":
        raise RuntimeError("Persona not ready")

    prof_path = repo_root() / "fixtures/persona-profiles" / f"{persona_id}.json"
    if not prof_path.is_file():
        raise RuntimeError(f"Persona profile missing: {persona_id}")
    profile = json.loads(prof_path.read_text(encoding="utf-8"))
    lang = job.request.language

    compile_step = next((s for s in job.steps if s.id == "compile"), None)
    if not compile_step or compile_step.state != JobState.COMPLETED:
        raise RuntimeError("Compile must finish before generating worlds")

    try:
        store.set_state(job_id, JobState.WORLDS)
        store.mark_step(job_id, "worlds", JobState.WORLDS, "Marble (source: Gemini preview images)")

        def progress(msg: str) -> None:
            store.append_log(job_id, msg)
            store.mark_step(job_id, "worlds", JobState.WORLDS, msg)

        world_slugs = await run_worlds_step(
            persona_id,
            profile,
            skip_existing=job.request.skip_existing_worlds,
            on_progress=progress,
            use_narrative_preview_as_source=True,
        )
        store.mark_step(job_id, "worlds", JobState.COMPLETED)
        store.refresh_artifacts(job_id)

        store.set_state(job_id, JobState.PUBLISH)
        store.mark_step(job_id, "publish", JobState.PUBLISH)
        await _publish(persona_id, lang, job_id)
        store.mark_step(job_id, "publish", JobState.COMPLETED)

        preview = f"/scene_configs/{persona_id}_{lang}.json"
        store.set_state(
            job_id,
            JobState.COMPLETED,
            preview_config_url=preview,
            world_slugs=world_slugs,
        )
        store.refresh_artifacts(job_id)
        store.append_log(job_id, f"Completed — {persona_id} published to WebXR")
    except Exception as e:
        store.append_log(job_id, f"FAILED finalize: {e}")
        job = store.get(job_id)
        if job:
            job.error = str(e)
            for step in job.steps:
                if step.state not in (JobState.COMPLETED, JobState.QUEUED):
                    step.state = JobState.FAILED
            store.set_state(job_id, JobState.FAILED, error=str(e))
            if job.persona_id and job.persona_id != "pending":
                store.refresh_artifacts(job_id)
