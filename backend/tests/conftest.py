from __future__ import annotations

import json
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture
def repo_root() -> Path:
    return REPO_ROOT


@pytest.fixture
def pipeline_job_dir(tmp_path, monkeypatch):
    """Isolate pipeline job JSON store per test."""
    jobs = tmp_path / "jobs"
    jobs.mkdir()
    monkeypatch.setenv("PIPELINE_JOB_DIR", str(jobs))
    from app.pipeline import config

    monkeypatch.setattr(config, "job_dir", lambda: jobs)
    return jobs


@pytest.fixture
def schott_profile(repo_root: Path) -> dict:
    path = repo_root / "fixtures/persona-profiles/schott_glasbau_ingenieur_v8.json"
    if not path.is_file():
        pytest.skip("schott profile fixture missing")
    return json.loads(path.read_text(encoding="utf-8"))


@pytest.fixture
def sick_act_blueprints(repo_root: Path) -> dict[int, dict]:
    base = repo_root / "fixtures/act-blueprints/sick_instandhaltung_lebensmittel_v1"
    if not base.is_dir():
        pytest.skip("sick act blueprints missing")
    out: dict[int, dict] = {}
    for n in range(1, 6):
        out[n] = json.loads((base / f"act-0{n}.json").read_text(encoding="utf-8"))
    return out
