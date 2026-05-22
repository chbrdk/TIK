from __future__ import annotations

import json

import pytest

from app.pipeline.schema_validate import (
    validate_act_blueprint,
    validate_all_act_blueprints,
    validate_persona_profile,
)


@pytest.fixture
def schott_act_02(repo_root):
    path = repo_root / "fixtures/act-blueprints/schott_glasbau_ingenieur_v8/act-02.json"
    if not path.is_file():
        pytest.skip("schott act-02 missing")
    return json.loads(path.read_text(encoding="utf-8"))


@pytest.fixture
def schott_profile(repo_root):
    path = repo_root / "fixtures/persona-profiles/schott_glasbau_ingenieur_v8.json"
    if not path.is_file():
        pytest.skip("schott profile missing")
    return json.loads(path.read_text(encoding="utf-8"))


def test_schott_act_02_passes_schema(schott_act_02):
    ok, err = validate_act_blueprint(schott_act_02)
    assert ok, err


def test_invalid_cue_rejected():
    bad = {
        "meta": {
            "blueprint_id": "x_act_01",
            "schema_version": "1.0",
            "language": "de",
            "product_layer": "nova",
        },
        "act": 1,
        "story": {
            "core_message_de": "x",
            "core_message_en": "x",
            "user_feeling": "x",
            "nova_role": "x",
        },
        "environment": {
            "environment_id": "env_x",
            "world_slug": "void-mirror",
            "scene_concept_de": "x",
            "lighting_preset": "void_minimal",
        },
        "image_prompts": {
            "splat_world": {
                "slug_hint": "void-mirror",
                "prompt_en": "interior",
                "negative_prompt": "office",
            }
        },
        "voiceover": {
            "pre_beat_tracks": [],
            "beat_track": {"track_id_suffix": "01", "estimated_duration_sec": 16, "lines": []},
        },
        "interaction": {
            "trigger_type": "scene_enter",
            "trigger_target": "focus",
            "primary_anchor": "focus",
            "delay_sec": 0,
            "haptic_pattern": "none",
        },
        "data_viz": {"mode": "none"},
        "timeline": {
            "target_duration_sec": 16,
            "pre_beat_cues": [{"cue_id": "bad", "action": "start", "at_sec": 0}],
            "beat_cue_templates": [{"type": "act_advance", "at_sec": 16}],
        },
    }
    ok, err = validate_act_blueprint(bad)
    assert not ok
    assert "pre_beat_cues" in err or "cue" in err.lower() or "additional" in err.lower()


def test_schott_profile_passes_schema(schott_profile):
    ok, err = validate_persona_profile(schott_profile)
    assert ok, err


def test_validate_all_acts_schott_v8(repo_root):
    ok, err = validate_all_act_blueprints("schott_glasbau_ingenieur_v8")
    assert ok, err
