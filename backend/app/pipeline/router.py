from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse

from .act_content import load_persona_acts_creative
from .config import elevenlabs_api_key, elevenlabs_voice_id, repo_root
from .elevenlabs_tts import ElevenLabsError
from .registry import list_personas_from_fixtures
from .finalize import run_finalize_worlds
from .resume import _RUNNING, detect_retry_step, run_pipeline_retry
from .runner import run_pipeline
from .schemas import (
    JobListItem,
    JobRetryRequest,
    JobState,
    JobStatus,
    PersonaActsCreativeResponse,
    PipelineSessionRequest,
    VoiceoverAudioStatusResponse,
    VoiceoverGenerateRequest,
    VoiceoverGenerateResponse,
    VoiceoverTrackAudioView,
)
from .voiceover_audio import (
    generate_voiceover_audio_async,
    list_voiceover_audio_status,
)
from .store import resolve_persona_id, store

router = APIRouter(prefix="/v1/pipeline", tags=["pipeline"])


@router.get("/personas")
async def list_personas() -> list[dict]:
    return [p.model_dump() for p in list_personas_from_fixtures()]


@router.get("/jobs", response_model=list[JobListItem])
async def list_jobs() -> list[JobListItem]:
    return store.list_jobs()


@router.post("/sessions", response_model=JobStatus)
async def create_session(
    body: PipelineSessionRequest,
    background_tasks: BackgroundTasks,
) -> JobStatus:
    job = store.create(body)
    background_tasks.add_task(run_pipeline, job.job_id)
    return job


def _elevenlabs_ready() -> bool:
    try:
        elevenlabs_api_key()
        return bool(elevenlabs_voice_id())
    except RuntimeError:
        return False


@router.get("/personas/{persona_id}/voiceover-audio", response_model=VoiceoverAudioStatusResponse)
async def get_persona_voiceover_audio(persona_id: str, language: str = "de") -> VoiceoverAudioStatusResponse:
    _ensure_persona_exists(persona_id)
    tracks = [
        VoiceoverTrackAudioView.model_validate(row)
        for row in list_voiceover_audio_status(persona_id, language)
    ]
    return VoiceoverAudioStatusResponse(
        persona_id=persona_id,
        language=language,
        tracks=tracks,
        elevenlabs_configured=_elevenlabs_ready(),
    )


@router.post("/personas/{persona_id}/voiceover-audio/generate", response_model=VoiceoverGenerateResponse)
async def generate_persona_voiceover_audio(
    persona_id: str,
    body: VoiceoverGenerateRequest | None = None,
) -> VoiceoverGenerateResponse:
    _ensure_persona_exists(persona_id)
    req = body or VoiceoverGenerateRequest()
    try:
        result = await generate_voiceover_audio_async(
            persona_id,
            language=req.language,
            track_ids=req.track_ids,
            force=req.force,
        )
    except (RuntimeError, ElevenLabsError) as exc:
        raise HTTPException(400, str(exc)) from exc
    return VoiceoverGenerateResponse.model_validate(result)


def _ensure_persona_exists(persona_id: str) -> None:
    prof = repo_root() / "fixtures/persona-profiles" / f"{persona_id}.json"
    if not prof.is_file() and not (repo_root() / "fixtures/act-blueprints" / persona_id).is_dir():
        golden = repo_root() / "fixtures/golden" / f"{persona_id}_de.json"
        if not golden.is_file():
            raise HTTPException(404, "Persona or act blueprints not found")


@router.get("/personas/{persona_id}/acts", response_model=PersonaActsCreativeResponse)
async def get_persona_acts_creative(persona_id: str) -> PersonaActsCreativeResponse:
    """Sprechertexte, Splat-Prompts und aufgelöste World-Prompts pro Act."""
    _ensure_persona_exists(persona_id)
    return PersonaActsCreativeResponse.model_validate(load_persona_acts_creative(persona_id))


@router.get("/jobs/{job_id}/acts", response_model=PersonaActsCreativeResponse)
async def get_job_acts_creative(job_id: str) -> PersonaActsCreativeResponse:
    job = store.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    persona_id = resolve_persona_id(job)
    if persona_id == "pending":
        raise HTTPException(400, "Persona not ready yet — wait for persona step")
    return PersonaActsCreativeResponse.model_validate(load_persona_acts_creative(persona_id))


@router.get("/jobs/{job_id}", response_model=JobStatus)
async def get_job(job_id: str) -> JobStatus:
    job = store.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    if job and job.persona_id != "pending":
        store.refresh_artifacts(job_id)
        job = store.get(job_id)
    return job


@router.get("/jobs/{job_id}/log")
async def get_job_log(job_id: str) -> dict[str, str]:
    if not store.get(job_id):
        raise HTTPException(404, "Job not found")
    return {"log": store.read_full_log(job_id)}


@router.get("/jobs/{job_id}/events")
async def job_events(job_id: str) -> StreamingResponse:
    job = store.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")

    async def stream():
        q = store.subscribe(job_id)
        yield f"data: {json.dumps({'type': 'job', 'job': job.model_dump(mode='json')})}\n\n"
        try:
            while True:
                try:
                    payload = await asyncio.wait_for(q.get(), timeout=30.0)
                    yield f"data: {json.dumps(payload)}\n\n"
                    if payload.get("job", {}).get("state") in ("completed", "failed"):
                        break
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
                    cur = store.get(job_id)
                    if cur and cur.state.value in ("completed", "failed"):
                        yield f"data: {json.dumps({'type': 'job', 'job': cur.model_dump(mode='json')})}\n\n"
                        break
        finally:
            store.unsubscribe(job_id, q)

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@router.post("/jobs/{job_id}/retry", response_model=JobStatus)
async def retry_job(
    job_id: str,
    background_tasks: BackgroundTasks,
    body: JobRetryRequest | None = None,
) -> JobStatus:
    """Re-run a failed, queued, or awaiting_worlds job from auto-detected or chosen step."""
    job = store.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    if job.state in _RUNNING:
        raise HTTPException(409, f"Job läuft noch ({job.state.value}) — bitte warten")

    from_step = (body.from_step if body else "auto").strip().lower()
    allowed_steps = {"auto", "persona", "acts", "narrative", "compile", "worlds", "full"}
    if from_step not in allowed_steps:
        raise HTTPException(400, f"from_step must be one of: {', '.join(sorted(allowed_steps))}")

    if from_step == "auto":
        from_step = detect_retry_step(job)

    job.error = None
    store.update(job)
    store.append_log(job_id, f"Retry angefordert (ab: {from_step})")

    async def _run() -> None:
        await run_pipeline_retry(job_id, from_step)

    background_tasks.add_task(_run)
    return store.get(job_id) or job


def _compile_done(job) -> bool:
    step = next((s for s in job.steps if s.id == "compile"), None)
    return step is not None and step.state == JobState.COMPLETED


@router.post("/jobs/{job_id}/generate-worlds", response_model=JobStatus)
async def generate_worlds(job_id: str, background_tasks: BackgroundTasks) -> JobStatus:
    """After scene preview approval: Marble worlds (Gemini PNG as source) + publish."""
    job = store.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    if job.persona_id == "pending":
        raise HTTPException(400, "Persona not ready")
    if not _compile_done(job):
        raise HTTPException(400, "Compile must complete before generating worlds")
    if job.state == JobState.COMPLETED:
        raise HTTPException(400, "Job already completed")
    if job.state == JobState.WORLDS:
        raise HTTPException(409, "World generation already running")

    allowed = {JobState.AWAITING_WORLDS, JobState.FAILED}
    if job.state not in allowed:
        raise HTTPException(
            400,
            f"Cannot generate worlds from state '{job.state.value}' (expected awaiting_worlds)",
        )

    job.error = None
    store.update(job)

    async def _run() -> None:
        await run_finalize_worlds(job_id)

    background_tasks.add_task(_run)
    job = store.get(job_id)
    store.mark_step(job_id, "worlds", JobState.WORLDS, "gestartet…")
    store.set_state(job_id, JobState.WORLDS)
    return store.get(job_id) or job


@router.post("/jobs/{job_id}/sync-worlds", response_model=JobStatus)
async def resync_worlds(job_id: str, background_tasks: BackgroundTasks) -> JobStatus:
    """Re-sync existing Marble assets to WebXR (anchors tuned in image-blaster)."""
    job = store.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    if job.state != JobState.COMPLETED:
        raise HTTPException(400, "Sync only for completed jobs")
    from .worlds_step import run_worlds_step
    import json as _json
    from .config import repo_root

    prof_path = repo_root() / "fixtures/persona-profiles" / f"{job.persona_id}.json"
    if not prof_path.is_file():
        raise HTTPException(400, "Persona profile missing")
    profile = _json.loads(prof_path.read_text(encoding="utf-8"))

    async def _sync():
        store.set_state(job_id, JobState.WORLDS)
        try:
            slugs = await run_worlds_step(
                job.persona_id,
                profile,
                skip_existing=True,
                on_progress=lambda m: store.append_log(job_id, m),
                use_narrative_preview_as_source=False,
            )
            store.set_state(job_id, JobState.COMPLETED, world_slugs=slugs)
        except Exception as e:
            store.set_state(job_id, JobState.FAILED, error=str(e))

    background_tasks.add_task(_sync)
    return job
