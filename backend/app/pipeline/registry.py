from __future__ import annotations

import json
from pathlib import Path

from .config import repo_root
from .schemas import PersonaSummary


def _narrative_preview_acts(persona_id: str) -> list[int]:
    preview_dir = repo_root() / "webxr/public/narrative-previews" / persona_id
    if not preview_dir.is_dir():
        return []
    acts: list[int] = []
    for act_num in (2, 3, 4):
        if (preview_dir / f"act-{act_num:02d}.png").is_file():
            acts.append(act_num)
    return acts


def list_personas_from_fixtures() -> list[PersonaSummary]:
    golden_dir = repo_root() / "fixtures/golden"
    out: list[PersonaSummary] = []
    if not golden_dir.is_dir():
        return out
    for path in sorted(golden_dir.glob("*_de.json")):
        stem = path.stem
        if not stem.endswith("_de"):
            continue
        persona_id = stem[: -len("_de")]
        language = "de"
        display_name = persona_id
        occupation: str | None = None
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            persona = data.get("persona") if isinstance(data.get("persona"), dict) else {}
            display_name = persona.get("display_name", persona_id)
            occupation = persona.get("occupation")
        except (json.JSONDecodeError, OSError):
            pass
        published_path = repo_root() / "webxr/public/scene_configs" / f"{persona_id}_{language}.json"
        published = published_path.is_file()
        preview_config_url = (
            f"/scene_configs/{persona_id}_{language}.json" if published else None
        )
        out.append(
            PersonaSummary(
                id=persona_id,
                display_name=display_name,
                language=language,
                occupation=occupation,
                published=published,
                preview_config_url=preview_config_url,
                narrative_preview_acts=_narrative_preview_acts(persona_id),
            )
        )
    return out


def golden_filename(persona_id: str, language: str) -> str:
    return f"{persona_id}_{language}.json"
