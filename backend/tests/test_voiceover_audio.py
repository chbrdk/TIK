from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.pipeline.voiceover_audio import (
    generate_voiceover_audio,
    list_voiceover_audio_status,
    load_voiceover_tracks,
)


def test_load_voiceover_tracks_from_narrative(tmp_path, monkeypatch):
    monkeypatch.setenv("TIK_REPO_ROOT", str(tmp_path))
    from app.pipeline import config

    monkeypatch.setattr(config, "repo_root", lambda: tmp_path)

    persona_id = "demo_persona"
    narr = tmp_path / "fixtures/narrative"
    narr.mkdir(parents=True)
    (narr / f"{persona_id}_de.json").write_text(
        json.dumps(
            {
                "voiceover_tracks": {
                    "nova_de_act1_01": {
                        "lines": [{"text": "Hallo Welt.", "at_sec": 0}],
                    }
                }
            }
        ),
        encoding="utf-8",
    )
    tracks = load_voiceover_tracks(persona_id, "de")
    assert "nova_de_act1_01" in tracks
    assert tracks["nova_de_act1_01"]["lines"][0]["text"] == "Hallo Welt."


def test_generate_voiceover_audio_writes_mp3(tmp_path, monkeypatch):
    monkeypatch.setenv("TIK_REPO_ROOT", str(tmp_path))
    monkeypatch.setenv("ELEVENLABS_API_KEY", "test-key")
    monkeypatch.setenv("ELEVENLABS_VOICE_ID", "voice123")
    from app.pipeline import config

    monkeypatch.setattr(config, "repo_root", lambda: tmp_path)

    persona_id = "demo_persona"
    narr = tmp_path / "fixtures/narrative"
    narr.mkdir(parents=True)
    (narr / f"{persona_id}_de.json").write_text(
        json.dumps(
            {
                "voiceover_tracks": {
                    "nova_de_act2_01": {
                        "lines": [
                            {"text": "Erste Zeile.", "at_sec": 0},
                            {"text": "Zweite Zeile.", "at_sec": 2},
                        ],
                    }
                }
            }
        ),
        encoding="utf-8",
    )

    monkeypatch.setattr(
        "app.pipeline.voiceover_audio.synthesize_speech_sync",
        lambda text, voice_id=None: b"fake-mp3-" + text.encode(),
    )

    result = generate_voiceover_audio(persona_id, language="de")
    assert result["generated"] == ["nova_de_act2_01"]
    mp3 = tmp_path / "webxr/public/voiceovers/de/nova_de_act2_01.mp3"
    assert mp3.is_file()
    assert b"fake-mp3" in mp3.read_bytes()

    status = list_voiceover_audio_status(persona_id, "de")
    assert status[0]["audio_exists"] is True
    assert status[0]["audio_url"] == "/voiceovers/de/nova_de_act2_01.mp3"
    assert len(status[0]["lines"]) == 2
    assert status[0]["lines"][0]["at_sec"] == 0

