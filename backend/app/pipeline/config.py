from __future__ import annotations

import os
from pathlib import Path

_BACKEND_ROOT = Path(__file__).resolve().parents[2]
_REPO_ROOT = _BACKEND_ROOT.parent


def repo_root() -> Path:
    raw = os.environ.get("TIK_REPO_ROOT", "").strip()
    return Path(raw) if raw else _REPO_ROOT


def blaster_root() -> Path:
    default = repo_root().parent / "image-blaster"
    raw = os.environ.get("IMAGE_BLASTER_ROOT", "").strip()
    return Path(raw) if raw else default


def job_dir() -> Path:
    raw = os.environ.get("PIPELINE_JOB_DIR", "").strip() or "fixtures/jobs"
    p = Path(raw)
    return p if p.is_absolute() else repo_root() / p


def claude_model() -> str:
    return os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-20250514")


def blaster_dev_url() -> str:
    return os.environ.get("IMAGE_BLASTER_DEV_URL", "https://localhost:5174").rstrip("/")


def splat_tier() -> str:
    return os.environ.get("SPLAT_TIER", "150k")


def google_api_key() -> str:
    for name in ("GOOGLE_API_KEY", "GEMINI_API_KEY", "GOOGLE_GENAI_API_KEY"):
        value = os.environ.get(name, "").strip()
        if value:
            return value
    raise RuntimeError(
        "Set GOOGLE_API_KEY (or GEMINI_API_KEY) in backend/.env for narrative scene previews."
    )


def gemini_image_model() -> str:
    return os.environ.get("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image")


def elevenlabs_api_key() -> str:
    value = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not value:
        raise RuntimeError(
            "Set ELEVENLABS_API_KEY in backend/.env for NOVA voiceover generation."
        )
    return value


def elevenlabs_voice_id() -> str:
    return os.environ.get("ELEVENLABS_VOICE_ID", "").strip()


def elevenlabs_model_id() -> str:
    return os.environ.get("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2")


def elevenlabs_base_url() -> str:
    return os.environ.get("ELEVENLABS_BASE_URL", "https://api.elevenlabs.io")


def voiceover_audio_dir(language: str = "de") -> Path:
    """Published NOVA MP3 directory (see knowledge/repos-and-urls.md)."""
    return repo_root() / "webxr/public/voiceovers" / language


def voiceover_audio_path(track_id: str, language: str = "de") -> Path:
    return voiceover_audio_dir(language) / f"{track_id}.mp3"


def voiceover_public_url(track_id: str, language: str = "de") -> str:
    return f"/voiceovers/{language}/{track_id}.mp3"
