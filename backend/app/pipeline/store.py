from __future__ import annotations

import asyncio
import json
import re
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

from .artifacts import collect_artifacts, load_persona_summary, world_public_urls
from .config import job_dir
from .schemas import JobListItem, JobState, JobStatus, JobStep, PipelineSessionRequest


_PERSONA_ID_RE = re.compile(r"persona_id:\s*([a-z][a-z0-9_]*)", re.I)
_ERROR_SUMMARY_MAX = 240


def _truncate_error(error: str | None) -> str | None:
    if not error:
        return None
    if len(error) <= _ERROR_SUMMARY_MAX:
        return error
    return error[: _ERROR_SUMMARY_MAX - 1] + "…"


def resolve_persona_id(job: JobStatus) -> str:
    """Use stored persona_id, or parse from completed persona step message (legacy jobs)."""
    if job.persona_id and job.persona_id != "pending":
        return job.persona_id
    for step in job.steps:
        if step.id == "persona" and step.message:
            m = _PERSONA_ID_RE.search(step.message)
            if m:
                return m.group(1)
    return job.persona_id or "pending"


def _now() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _job_path(job_id: str) -> Path:
    return job_dir() / job_id / "job.json"


def _log_path(job_id: str) -> Path:
    return job_dir() / job_id / "log.txt"


class JobStore:
    def __init__(self) -> None:
        self._subscribers: dict[str, list[asyncio.Queue[dict[str, Any]]]] = {}

    def create(self, request: PipelineSessionRequest) -> JobStatus:
        job_id = f"job_{uuid4().hex[:12]}"
        steps = [
            JobStep(id="persona", label="Persona profile", state=JobState.QUEUED),
            JobStep(id="acts", label="Act blueprints (×5)", state=JobState.QUEUED),
            JobStep(id="narrative", label="Szenen-Vorschau (Gemini)", state=JobState.QUEUED),
            JobStep(id="compile", label="Compile session", state=JobState.QUEUED),
            JobStep(id="worlds", label="Marble worlds", state=JobState.QUEUED),
            JobStep(id="publish", label="Publish to WebXR", state=JobState.QUEUED),
        ]
        job = JobStatus(
            job_id=job_id,
            persona_id=request.persona_id or "pending",
            state=JobState.QUEUED,
            steps=steps,
            created_at=_now(),
            updated_at=_now(),
            request=request,
        )
        self._write(job)
        label = request.persona_id or f"{request.company_name} (id wird generiert)"
        self._append_log(job_id, f"Job created — {label}")
        return job

    def set_persona_id(self, job_id: str, persona_id: str) -> JobStatus:
        job = self.get(job_id)
        if not job:
            raise KeyError(job_id)
        job.persona_id = persona_id
        job.request.persona_id = persona_id
        self.update(job)
        return self.refresh_artifacts(job_id)

    def refresh_artifacts(self, job_id: str) -> JobStatus:
        job = self.get(job_id)
        if not job:
            raise KeyError(job_id)
        pid = job.persona_id
        lang = job.request.language
        if pid and pid != "pending":
            job.artifacts = collect_artifacts(pid, lang) + world_public_urls(job.world_slugs)
            job.summary = load_persona_summary(pid)
        return self.update(job)

    def read_full_log(self, job_id: str) -> str:
        path = _log_path(job_id)
        if not path.is_file():
            return ""
        return path.read_text(encoding="utf-8")

    def get(self, job_id: str) -> JobStatus | None:
        path = _job_path(job_id)
        if not path.is_file():
            return None
        job = JobStatus.model_validate_json(path.read_text(encoding="utf-8"))
        resolved = resolve_persona_id(job)
        if resolved != job.persona_id:
            job.persona_id = resolved
            if job.request.persona_id is None or job.request.persona_id == "pending":
                job.request.persona_id = resolved if resolved != "pending" else None
        return job

    def list_jobs(self) -> list[JobListItem]:
        root = job_dir()
        if not root.is_dir():
            return []
        entries: list[tuple[float, JobListItem]] = []
        for job_dir_path in root.iterdir():
            if not job_dir_path.is_dir() or not job_dir_path.name.startswith("job_"):
                continue
            job_file = job_dir_path / "job.json"
            if not job_file.is_file():
                continue
            try:
                job = JobStatus.model_validate_json(job_file.read_text(encoding="utf-8"))
            except Exception:
                continue
            req = job.request
            entries.append(
                (
                    job_file.stat().st_mtime,
                    JobListItem(
                        job_id=job.job_id,
                        persona_id=resolve_persona_id(job),
                        state=job.state,
                        company_name=req.company_name,
                        target_audience=req.target_audience,
                        language=req.language,
                        created_at=job.created_at,
                        updated_at=job.updated_at,
                        preview_config_url=job.preview_config_url,
                        error=_truncate_error(job.error),
                        generate_worlds=req.generate_worlds,
                    ),
                )
            )
        entries.sort(key=lambda x: x[0], reverse=True)
        return [item for _, item in entries]

    def update(self, job: JobStatus) -> JobStatus:
        job.updated_at = _now()
        self._write(job)
        self._broadcast(job)
        return job

    def set_state(self, job_id: str, state: JobState, **kwargs: Any) -> JobStatus:
        job = self.get(job_id)
        if not job:
            raise KeyError(job_id)
        job.state = state
        for k, v in kwargs.items():
            setattr(job, k, v)
        return self.update(job)

    def mark_step(self, job_id: str, step_id: str, state: JobState, message: str | None = None) -> JobStatus:
        job = self.get(job_id)
        if not job:
            raise KeyError(job_id)
        for step in job.steps:
            if step.id == step_id:
                step.state = state
                step.message = message
        return self.update(job)

    def append_log(self, job_id: str, line: str) -> None:
        self._append_log(job_id, line)
        job = self.get(job_id)
        if job:
            log_path = _log_path(job_id)
            tail = log_path.read_text(encoding="utf-8")[-4000:] if log_path.is_file() else line
            job.log_tail = tail
            self.update(job)

    def subscribe(self, job_id: str) -> asyncio.Queue[dict[str, Any]]:
        q: asyncio.Queue[dict[str, Any]] = asyncio.Queue()
        self._subscribers.setdefault(job_id, []).append(q)
        return q

    def unsubscribe(self, job_id: str, q: asyncio.Queue[dict[str, Any]]) -> None:
        subs = self._subscribers.get(job_id, [])
        if q in subs:
            subs.remove(q)

    def _write(self, job: JobStatus) -> None:
        path = _job_path(job.job_id)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(job.model_dump_json(indent=2), encoding="utf-8")

    def _append_log(self, job_id: str, line: str) -> None:
        path = _log_path(job_id)
        path.parent.mkdir(parents=True, exist_ok=True)
        ts = _now()
        with path.open("a", encoding="utf-8") as f:
            f.write(f"[{ts}] {line}\n")

    def _broadcast(self, job: JobStatus) -> None:
        payload = {"type": "job", "job": job.model_dump(mode="json")}
        for q in self._subscribers.get(job.job_id, []):
            try:
                q.put_nowait(payload)
            except asyncio.QueueFull:
                pass


store = JobStore()
