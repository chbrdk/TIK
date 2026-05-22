from __future__ import annotations

import json

from .act_agent import run_act_step
from .config import repo_root
from .persona_agent import profile_persona_id, run_persona_step
from .schemas import JobState, PipelineSessionRequest
from .store import store
from .subprocess_runner import run_node_script
from .narrative_previews_step import run_narrative_previews_step
from .worlds_step import collect_world_slugs, run_worlds_step

STEP_ORDER = ("persona", "acts", "narrative", "compile", "worlds", "publish")


def _load_profile(persona_id: str) -> dict:
    path = repo_root() / "fixtures/persona-profiles" / f"{persona_id}.json"
    return json.loads(path.read_text(encoding="utf-8"))


async def _run_from_persona(
    job_id: str,
    req: PipelineSessionRequest,
    lang: str,
) -> tuple[dict, str]:
    store.set_state(job_id, JobState.PERSONA)
    store.mark_step(job_id, "persona", JobState.PERSONA, "Claude persona agent")
    store.append_log(job_id, "Starting persona agent (persona_id wird generiert)")

    profile = await run_persona_step(
        req.persona_id,
        req.target_audience,
        req.company_name,
        req.company_description,
        req.company_industry,
        lang,
    )
    persona_id = profile_persona_id(profile)
    store.set_persona_id(job_id, persona_id)
    store.refresh_artifacts(job_id)
    store.mark_step(job_id, "persona", JobState.COMPLETED, f"persona_id: {persona_id}")
    store.append_log(job_id, f"Persona profile written: {persona_id}")
    return profile, persona_id


async def _run_acts_through_publish(
    job_id: str,
    persona_id: str,
    profile: dict,
    req: PipelineSessionRequest,
    lang: str,
    *,
    start_after_step: str | None = None,
) -> None:
    start_idx = STEP_ORDER.index(start_after_step) if start_after_step else STEP_ORDER.index("acts")

    if start_idx <= STEP_ORDER.index("acts"):
        store.set_state(job_id, JobState.ACTS)
        store.mark_step(job_id, "acts", JobState.ACTS, "Generating act blueprints")
        await run_act_step(profile)
        store.mark_step(job_id, "acts", JobState.COMPLETED)
        store.refresh_artifacts(job_id)
        store.append_log(job_id, "All act blueprints validated")

    if start_idx <= STEP_ORDER.index("narrative"):
        if req.generate_narrative_previews:
            store.set_state(job_id, JobState.NARRATIVE)
            store.mark_step(job_id, "narrative", JobState.NARRATIVE, "Gemini scene previews")

            def preview_progress(msg: str) -> None:
                store.append_log(job_id, msg)
                store.mark_step(job_id, "narrative", JobState.NARRATIVE, msg)

            await run_narrative_previews_step(
                persona_id,
                profile,
                skip_existing=req.skip_existing_previews,
                on_progress=preview_progress,
            )
            store.mark_step(job_id, "narrative", JobState.COMPLETED)
            store.refresh_artifacts(job_id)
            store.append_log(job_id, "Narrative previews ready — review in Job detail")
        else:
            store.mark_step(job_id, "narrative", JobState.COMPLETED, "skipped")

    if start_idx <= STEP_ORDER.index("compile"):
        store.set_state(job_id, JobState.COMPILE)
        store.mark_step(job_id, "compile", JobState.COMPILE)
        await _compile(persona_id, lang, job_id)
        store.mark_step(job_id, "compile", JobState.COMPLETED)
        store.refresh_artifacts(job_id)

    world_slugs: list[str] = collect_world_slugs(profile)
    if req.generate_worlds:
        if start_idx <= STEP_ORDER.index("worlds"):
            store.set_state(job_id, JobState.WORLDS)
            store.mark_step(job_id, "worlds", JobState.WORLDS)

            def progress(msg: str) -> None:
                store.append_log(job_id, msg)
                store.mark_step(job_id, "worlds", JobState.WORLDS, msg)

            world_slugs = await run_worlds_step(
                persona_id,
                profile,
                skip_existing=req.skip_existing_worlds,
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
        store.append_log(job_id, f"Completed — {persona_id}. Artefakte siehe Job-Übersicht.")
    else:
        store.mark_step(job_id, "worlds", JobState.QUEUED, "Warte auf Freigabe in Admin")
        store.mark_step(job_id, "publish", JobState.QUEUED, "Nach Marble")
        store.set_state(job_id, JobState.AWAITING_WORLDS, world_slugs=world_slugs)
        store.refresh_artifacts(job_id)
        store.append_log(
            job_id,
            "Szenen-Vorschau bereit — in Admin prüfen, dann „Welten generieren“.",
        )


async def run_pipeline(job_id: str) -> None:
    job = store.get(job_id)
    if not job:
        return
    req = job.request
    lang = req.language

    try:
        profile, persona_id = await _run_from_persona(job_id, req, lang)
        await _run_acts_through_publish(job_id, persona_id, profile, req, lang)
    except Exception as e:
        store.append_log(job_id, f"FAILED: {e}")
        job = store.get(job_id)
        if job:
            job.error = str(e)
            for step in job.steps:
                if step.state not in (JobState.COMPLETED, JobState.QUEUED):
                    step.state = JobState.FAILED
            store.set_state(job_id, JobState.FAILED, error=str(e))
            if job.persona_id and job.persona_id != "pending":
                store.refresh_artifacts(job_id)


async def _compile(persona_id: str, lang: str, job_id: str) -> None:
    steps = [
        ("scripts/compile-persona-profile.mjs", ["--profile", persona_id]),
        ("scripts/compile-act-blueprint.mjs", ["--all", "--persona", persona_id, "--profile", persona_id]),
        ("scripts/assemble-scene-config-from-manifest.mjs", ["--profile", persona_id, "--lang", lang]),
    ]
    for script, args in steps:
        store.append_log(job_id, f"node {script} {' '.join(args)}")
        r = await run_node_script(script, args, timeout=300)
        if r.returncode != 0:
            raise RuntimeError(f"{script} failed: {r.stderr or r.stdout}")


async def _publish(persona_id: str, lang: str, job_id: str) -> None:
    r = await run_node_script(
        "scripts/publish-session-to-webxr.mjs",
        ["--profile", persona_id, "--lang", lang],
        timeout=120,
    )
    if r.returncode != 0:
        raise RuntimeError(f"publish failed: {r.stderr or r.stdout}")
    golden = repo_root() / "fixtures/golden" / f"{persona_id}_{lang}.json"
    vr = await run_node_script("scripts/validate-schema.mjs", [str(golden)])
    if vr.returncode != 0:
        raise RuntimeError(f"schema validation failed: {vr.stderr or vr.stdout}")
    store.append_log(job_id, "Published to webxr/public")
