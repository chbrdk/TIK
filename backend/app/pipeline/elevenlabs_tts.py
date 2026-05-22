from __future__ import annotations

import httpx

from .config import elevenlabs_api_key, elevenlabs_base_url, elevenlabs_model_id, elevenlabs_voice_id


class ElevenLabsError(RuntimeError):
    pass


def synthesize_speech_sync(text: str, *, voice_id: str | None = None) -> bytes:
    """Generate MP3 bytes for one voiceover script (German NOVA)."""
    clean = (text or "").strip()
    if not clean:
        raise ElevenLabsError("Empty text")
    voice = (voice_id or elevenlabs_voice_id()).strip()
    if not voice:
        raise ElevenLabsError("Set ELEVENLABS_VOICE_ID in backend/.env (ElevenLabs voice id)")

    payload = {
        "text": clean,
        "model_id": elevenlabs_model_id(),
        "voice_settings": {
            "stability": 0.35,
            "similarity_boost": 0.8,
            "style": 0.25,
            "use_speaker_boost": True,
        },
    }
    headers = {
        "xi-api-key": elevenlabs_api_key(),
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
    }
    url = f"{elevenlabs_base_url().rstrip('/')}/v1/text-to-speech/{voice}"
    with httpx.Client(timeout=120.0) as client:
        response = client.post(url, headers=headers, json=payload)
        if response.status_code >= 400:
            raise ElevenLabsError(
                f"ElevenLabs HTTP {response.status_code}: {response.text[:400]}"
            )
        return response.content
