from __future__ import annotations

import copy
import json
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from .schemas import SessionRequest

# TIK repo root (backend/app/persona_reality -> backend -> TIK)
_REPO_ROOT = Path(__file__).resolve().parents[3]
_GOLDEN_DIR = _REPO_ROOT / "fixtures" / "golden"
_NARRATIVE_DIR = _REPO_ROOT / "fixtures" / "narrative"
_SCHEMA_PATH = _REPO_ROOT / "scene_config.v1.schema.json"

_sessions: dict[str, dict] = {}

_SUPPORTED_GOLDEN_KEYS: dict[tuple[str, str], str] = {
    ("klaus_dortmund", "de"): "klaus_dortmund_de.json",
}


class PersonaNotFoundError(Exception):
    def __init__(self, persona_id: str) -> None:
        self.persona_id = persona_id
        super().__init__(f"Persona not found: {persona_id}")


class LanguageNotAvailableError(Exception):
    def __init__(self, persona_id: str, language: str) -> None:
        self.persona_id = persona_id
        self.language = language
        super().__init__(f"No session fixture for {persona_id} ({language})")


def schema_path() -> Path:
    return _SCHEMA_PATH


def repo_root() -> Path:
    return _REPO_ROOT


def load_narrative_manifest(persona_id: str, language: str) -> dict | None:
    path = _NARRATIVE_DIR / f"{persona_id}_{language}.json"
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def merge_narrative_into_config(config: dict, manifest: dict | None) -> dict:
    """Inline voiceover lines and beat cues from narrative manifest (matches Node merge script)."""
    if not manifest:
        return config

    tracks = manifest.get("voiceover_tracks") or {}
    scripts_by_act = {s["act"]: s for s in manifest.get("act_scripts") or []}

    for beat in config.get("narrative_beats") or []:
        track_id = beat.get("voiceover_track_id")
        track = tracks.get(track_id) if track_id else None
        if track:
            beat["lines"] = copy.deepcopy(track.get("lines") or [])
            beat["estimated_duration_sec"] = track.get("estimated_duration_sec")

        act = beat.get("act")
        script = scripts_by_act.get(act) if act else None
        templates = (script or {}).get("beat_cue_templates") or {}
        template = templates.get(track_id) if track_id else None
        if template:
            beat["cues"] = copy.deepcopy(template)

        est = beat.get("estimated_duration_sec") or beat.get("duration_sec") or 8
        beat["duration_sec"] = max(beat.get("duration_sec") or 0, est)

    return config


def load_golden_config(persona_id: str, language: str) -> dict:
    filename = _SUPPORTED_GOLDEN_KEYS.get((persona_id, language))
    if not filename:
        if (persona_id, "de") in _SUPPORTED_GOLDEN_KEYS and language == "en":
            raise LanguageNotAvailableError(persona_id, language)
        raise PersonaNotFoundError(persona_id)

    path = _GOLDEN_DIR / filename
    if not path.is_file():
        raise FileNotFoundError(f"Golden fixture missing: {path}")

    return json.loads(path.read_text(encoding="utf-8"))


def compose_session_stub(request: SessionRequest) -> dict:
    config = copy.deepcopy(load_golden_config(request.persona_id, request.language))
    manifest = load_narrative_manifest(request.persona_id, request.language)
    config = merge_narrative_into_config(config, manifest)

    scene_id = f"se_{uuid4().hex[:12]}"
    now = datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    config["meta"]["scene_id"] = scene_id
    config["meta"]["persona_id"] = request.persona_id
    config["meta"]["generated_at"] = now
    config["meta"]["language"] = request.language
    config["meta"]["client_id"] = request.client_id
    config["meta"]["schema_version"] = "1.0"

    if request.client_id:
        config["brand_layer"] = config.get("brand_layer") or {
            "client_id": request.client_id,
            "logo_texture": f"https://cdn.msqdx.de/brands/{request.client_id}/logo.png",
            "color_primary": "#005F61",
            "color_secondary": "#FFFFFF",
            "props_swap": [],
        }

    report_id = scene_id
    config["report"] = {
        "qr_url": f"https://msqdx.de/pr/r/{report_id}",
        "report_id": report_id,
    }

    _sessions[scene_id] = config
    return config


def get_session(scene_id: str) -> dict | None:
    return _sessions.get(scene_id)


def list_persona_summaries() -> list[dict]:
    config = load_golden_config("klaus_dortmund", "de")
    persona = config["persona"]
    axes = persona["axes"]
    return [
        {
            "id": persona["id"],
            "display_name": persona["display_name"],
            "short_descriptor": f"{persona['occupation']} · {persona['location']}",
            "axes": axes,
        }
    ]


def validate_against_schema(config: dict) -> None:
    import jsonschema

    schema = json.loads(schema_path().read_text(encoding="utf-8"))
    jsonschema.validate(instance=config, schema=schema)
