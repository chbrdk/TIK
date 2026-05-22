from __future__ import annotations

import json
from pathlib import Path

from .config import repo_root
from .schemas import JobArtifactItem, JobResultSummary


def _add(items: list[JobArtifactItem], kind: str, label: str, rel: str, public_url: str | None = None) -> None:
    p = repo_root() / rel
    items.append(
        JobArtifactItem(
            kind=kind,
            label=label,
            path=rel,
            exists=p.is_file(),
            public_url=public_url if p.is_file() and public_url else None,
        )
    )


def collect_artifacts(persona_id: str, language: str) -> list[JobArtifactItem]:
    if not persona_id or persona_id == "pending":
        return []

    items: list[JobArtifactItem] = []
    lang = language or "de"

    _add(items, "input", "Persona-Input", f"fixtures/persona-inputs/{persona_id}.json")
    _add(items, "profile", "Persona-Profile", f"fixtures/persona-profiles/{persona_id}.json")
    _add(items, "persona", "Persona (compile)", f"fixtures/personas/{persona_id}.json")

    for n in range(1, 6):
        _add(
            items,
            "act",
            f"Act {n} Blueprint",
            f"fixtures/act-blueprints/{persona_id}/act-0{n}.json",
        )
        preview_rel = f"webxr/public/narrative-previews/{persona_id}/act-0{n}.png"
        _add(
            items,
            "preview",
            f"Act {n} Szenen-Vorschau",
            preview_rel,
            public_url=f"/narrative-previews/{persona_id}/act-0{n}.png",
        )

    gen = f"fixtures/generated/{persona_id}"
    _add(items, "generated", "Session-Act-Manifest", f"{gen}/session-act-manifest.json")
    _add(items, "generated", "Generated Bundles", f"{gen}/")

    golden_rel = f"fixtures/golden/{persona_id}_{lang}.json"
    _add(
        items,
        "golden",
        "scene_config (golden)",
        golden_rel,
        public_url=f"/scene_configs/{persona_id}_{lang}.json",
    )
    narr_rel = f"fixtures/narrative/{persona_id}_{lang}.json"
    _add(
        items,
        "narrative",
        "Narrative-Manifest",
        narr_rel,
        public_url=f"/narrative/{persona_id}_{lang}.json",
    )

    pub_cfg = f"webxr/public/scene_configs/{persona_id}_{lang}.json"
    _add(
        items,
        "publish",
        "WebXR scene_config (public)",
        pub_cfg,
        public_url=f"/scene_configs/{persona_id}_{lang}.json",
    )
    pub_narr = f"webxr/public/narrative/{persona_id}_{lang}.json"
    _add(
        items,
        "publish",
        "WebXR narrative (public)",
        pub_narr,
        public_url=f"/narrative/{persona_id}_{lang}.json",
    )

    return items


def load_persona_summary(persona_id: str) -> JobResultSummary | None:
    path = repo_root() / "fixtures/persona-profiles" / f"{persona_id}.json"
    if not path.is_file():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None

    persona = data.get("persona") or {}
    arc = data.get("session_arc") or {}
    acts_out: list[dict] = []
    for key in sorted((arc.get("acts") or {}).keys(), key=lambda x: int(x)):
        act = arc["acts"][key]
        acts_out.append(
            {
                "act": int(key),
                "title_de": act.get("title_de"),
                "world_slug": act.get("world_slug"),
                "environment_id": act.get("environment_id"),
            }
        )
    return JobResultSummary(
        display_name=persona.get("display_name"),
        occupation=persona.get("occupation"),
        location=persona.get("location"),
        throughline_de=arc.get("throughline_de"),
        acts=acts_out,
    )


def world_public_urls(world_slugs: list[str]) -> list[JobArtifactItem]:
    out: list[JobArtifactItem] = []
    for slug in world_slugs:
        rel = f"webxr/public/worlds/{slug}/manifest.json"
        _add(out, "world", f"Welt: {slug}", rel, public_url=f"/worlds/{slug}/manifest.json")
    return out
