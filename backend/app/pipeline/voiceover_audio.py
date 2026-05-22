from __future__ import annotations

import asyncio
import json
import re
from pathlib import Path
from typing import Any

from .config import repo_root, voiceover_audio_dir, voiceover_audio_path, voiceover_public_url
from .elevenlabs_tts import ElevenLabsError, synthesize_speech_sync
from .worlds_step import load_act_blueprints

_TRACK_ACT_RE = re.compile(r"^nova_[a-z]{2}_act(\d+)_")


def _track_act_num(track_id: str) -> int | None:
    match = _TRACK_ACT_RE.match(track_id)
    if not match:
        return None
    return int(match.group(1))


def _track_text(track: dict[str, Any]) -> str:
    lines = track.get("lines") if isinstance(track.get("lines"), list) else []
    parts: list[str] = []
    for line in lines:
        if not isinstance(line, dict):
            continue
        text = (line.get("text") or "").strip()
        if text:
            parts.append(text)
    return " ".join(parts).strip()


def _load_narrative_fixture(persona_id: str, language: str) -> dict[str, Any] | None:
    path = repo_root() / "fixtures/narrative" / f"{persona_id}_{language}.json"
    if not path.is_file():
        return None
    data = json.loads(path.read_text(encoding="utf-8"))
    tracks = data.get("voiceover_tracks")
    return tracks if isinstance(tracks, dict) else None


def _load_manifest_tracks(persona_id: str) -> dict[str, Any] | None:
    path = repo_root() / "fixtures/generated" / persona_id / "session-act-manifest.json"
    if not path.is_file():
        return None
    data = json.loads(path.read_text(encoding="utf-8"))
    tracks = data.get("voiceover_tracks")
    return tracks if isinstance(tracks, dict) else None


def _tracks_from_blueprints(persona_id: str, language: str) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for act_num, bp in load_act_blueprints(persona_id).items():
        vo = bp.get("voiceover")
        if not isinstance(vo, dict):
            continue
        for track in vo.get("pre_beat_tracks") or []:
            if not isinstance(track, dict):
                continue
            suffix = track.get("track_id_suffix", "01")
            tid = f"nova_{language}_act{act_num}_{suffix}"
            out[tid] = track
        beat = vo.get("beat_track")
        if isinstance(beat, dict):
            suffix = beat.get("track_id_suffix", "01")
            tid = f"nova_{language}_act{act_num}_{suffix}"
            out[tid] = beat
    return out


def load_voiceover_tracks(persona_id: str, language: str = "de") -> dict[str, Any]:
    """Resolve all NOVA tracks for a persona (narrative fixture → manifest → blueprints)."""
    tracks = _load_narrative_fixture(persona_id, language)
    if tracks:
        return tracks
    tracks = _load_manifest_tracks(persona_id)
    if tracks:
        return tracks
    return _tracks_from_blueprints(persona_id, language)


def _track_lines(track: dict[str, Any]) -> list[dict[str, Any]]:
    raw = track.get("lines") if isinstance(track.get("lines"), list) else []
    lines: list[dict[str, Any]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        text = (item.get("text") or "").strip()
        if not text:
            continue
        at = item.get("at_sec")
        line: dict[str, Any] = {
            "text": text,
            "at_sec": float(at if isinstance(at, (int, float)) else 0),
        }
        pause = item.get("pause_after_sec")
        if isinstance(pause, (int, float)):
            line["pause_after_sec"] = float(pause)
        lines.append(line)
    return sorted(lines, key=lambda x: x["at_sec"])


def list_voiceover_audio_status(persona_id: str, language: str = "de") -> list[dict[str, Any]]:
    tracks = load_voiceover_tracks(persona_id, language)
    rows: list[dict[str, Any]] = []
    for track_id in sorted(tracks.keys()):
        track = tracks[track_id]
        if not isinstance(track, dict):
            continue
        lines = _track_lines(track)
        text = _track_text(track)
        audio_path = voiceover_audio_path(track_id, language)
        rows.append(
            {
                "track_id": track_id,
                "act": _track_act_num(track_id),
                "line_count": len(lines),
                "text_preview": text[:160] + ("…" if len(text) > 160 else ""),
                "text": text,
                "lines": lines,
                "audio_exists": audio_path.is_file(),
                "audio_url": voiceover_public_url(track_id, language)
                if audio_path.is_file()
                else None,
                "estimated_duration_sec": track.get("estimated_duration_sec"),
            }
        )
    return rows


def generate_voiceover_audio(
    persona_id: str,
    *,
    language: str = "de",
    track_ids: list[str] | None = None,
    force: bool = False,
) -> dict[str, Any]:
    tracks = load_voiceover_tracks(persona_id, language)
    if not tracks:
        raise ElevenLabsError(f"No voiceover tracks for {persona_id}")

    targets = sorted(track_ids) if track_ids else sorted(tracks.keys())
    generated: list[str] = []
    skipped: list[str] = []
    errors: dict[str, str] = {}

    voiceover_audio_dir(language).mkdir(parents=True, exist_ok=True)

    for track_id in targets:
        track = tracks.get(track_id)
        if not isinstance(track, dict):
            errors[track_id] = "unknown track"
            continue
        dest = voiceover_audio_path(track_id, language)
        if dest.is_file() and not force:
            skipped.append(track_id)
            continue
        text = _track_text(track)
        if not text:
            errors[track_id] = "no lines"
            continue
        try:
            audio = synthesize_speech_sync(text)
            dest.write_bytes(audio)
            generated.append(track_id)
        except ElevenLabsError as exc:
            errors[track_id] = str(exc)

    return {
        "persona_id": persona_id,
        "language": language,
        "generated": generated,
        "skipped": skipped,
        "errors": errors,
        "tracks": list_voiceover_audio_status(persona_id, language),
    }


async def generate_voiceover_audio_async(
    persona_id: str,
    *,
    language: str = "de",
    track_ids: list[str] | None = None,
    force: bool = False,
) -> dict[str, Any]:
    return await asyncio.to_thread(
        generate_voiceover_audio,
        persona_id,
        language=language,
        track_ids=track_ids,
        force=force,
    )
