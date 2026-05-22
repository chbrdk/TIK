from __future__ import annotations

from app.pipeline.normalize_act import normalize_act_blueprint


def test_strips_root_persona_id():
    profile = {
        "meta": {"persona_id": "schott_einkaeuf_v1", "language": "de"},
        "persona": {"id": "schott_einkaeuf_v1", "display_name": "Test"},
        "company_context": {"name": "Schott"},
        "session_arc": {
            "acts": {
                "1": {
                    "world_slug": "void-mirror",
                    "environment_id": "env_void_mirror",
                    "lighting_preset": "void_minimal",
                    "trigger_type": "scene_enter",
                    "trigger_target": "mirror_center",
                    "primary_anchor": "mirror_center",
                    "scene_concept_de": "Minimaler Spiegelraum für Identitätswechsel in der Glasbau-Demo.",
                    "splat_prompt_en": "Abstract void mirror room photorealistic 360 interior dark floor cinematic",
                }
            }
        },
    }
    raw = {
        "persona_id": "wrong",
        "schema_version": "1.0",
        "act": 1,
        "nova_speech": {"lines": []},
    }
    bp = normalize_act_blueprint(raw, profile, 1)
    assert "persona_id" not in bp
    assert "schema_version" not in bp
    assert bp["meta"]["schema_version"] == "1.0"
    assert bp["act"] == 1
    assert "story" in bp and "voiceover" in bp


def _profile_with_acts():
    return {
        "meta": {"persona_id": "schott_glasbau_ingenieur_v1", "language": "de"},
        "persona": {"id": "schott_glasbau_ingenieur_v1", "display_name": "Test"},
        "company_context": {"name": "Schott"},
        "session_arc": {
            "acts": {
                str(n): {
                    "world_slug": "void-mirror",
                    "environment_id": "env_void_mirror",
                    "lighting_preset": "void_minimal",
                    "trigger_type": "scene_enter" if n == 1 else "look_at",
                    "trigger_target": "focus_point",
                    "primary_anchor": "focus_point",
                    "scene_concept_de": "Demo-Szene für Validierung.",
                    "splat_prompt_en": "Photorealistic industrial interior 360",
                }
                for n in range(1, 6)
            }
        },
    }


def test_sanitizes_voiceover_track_id_suffix():
    profile = _profile_with_acts()
    raw = {
        "act": 1,
        "voiceover": {
            "pre_beat_tracks": [
                {
                    "track_id_suffix": "act01_intro_voice",
                    "lines": [{"text": "Intro.", "at_sec": 0}],
                }
            ],
            "beat_track": {
                "track_id_suffix": "act01_void_question",
                "lines": [{"text": "Beat.", "at_sec": 0}],
            },
        },
    }
    bp = normalize_act_blueprint(raw, profile, 1)
    assert bp["voiceover"]["pre_beat_tracks"] == []
    assert bp["voiceover"]["beat_track"]["track_id_suffix"] == "01"
    from app.pipeline.schema_validate import validate_act_blueprint

    ok, err = validate_act_blueprint(bp)
    assert ok, err


def test_sanitizes_act1_claude_field_mistakes():
    profile = _profile_with_acts()
    raw = {
        "act": 1,
        "environment": {
            "atmosphere_notes": "ethereal void",
            "world_slug": "void-mirror-identity",
            "lighting_preset": "void_minimal",
            "scene_concept_de": "Void mirror room for identity onboarding in industrial demo.",
        },
        "image_prompts": {
            "splat_world": {
                "prompt_en": "Abstract void mirror space photorealistic 360 immersive minimal lighting",
                "negative_prompt_en": "kitchen, office, people",
                "anchor_placements": [
                    {"id": "void_mirror", "label": "center mirror"},
                    {"object": "floor_glow", "role": "ambient"},
                ],
            }
        },
        "timeline": {
            "pre_beat_cues": [
                {"type": "fade", "at_sec": 17, "mode": "fade_in_slow"},
            ],
            "beat_cue_templates": [{"type": "act_advance", "at_sec": 18}],
        },
    }
    bp = normalize_act_blueprint(raw, profile, 1)
    from app.pipeline.schema_validate import validate_act_blueprint

    assert "atmosphere_notes" not in bp["environment"]
    assert bp["image_prompts"]["splat_world"]["negative_prompt"]
    assert "negative_prompt_en" not in bp["image_prompts"]["splat_world"]
    assert bp["image_prompts"]["splat_world"]["anchor_placements"][0]["anchor_id"] == "void_mirror"
    assert bp["timeline"]["pre_beat_cues"][0]["mode"] == "in"
    ok, err = validate_act_blueprint(bp)
    assert ok, err


def test_sanitizes_invalid_timeline_cues():
    profile = _profile_with_acts()
    raw = {
        "act": 2,
        "timeline": {
            "target_duration_sec": 20,
            "pre_beat_cues": [
                {"cue_id": "c1", "action": "start", "description": "fade in", "at_sec": 0},
            ],
            "beat_cue_templates": [
                {"cue_id": "b1", "action": "show", "description": "overlay", "at_sec": 4},
            ],
        },
    }
    bp = normalize_act_blueprint(raw, profile, 2)
    pre = bp["timeline"]["pre_beat_cues"][0]
    assert "cue_id" not in pre
    assert pre["type"] in ("subtitle", "fade", "hint_primary")
    assert isinstance(pre["at_sec"], (int, float))
    beat = bp["timeline"]["beat_cue_templates"]
    assert any(c["type"] == "act_advance" for c in beat)


def test_sanitizes_act5_story_and_voiceover_speaker():
    profile = _profile_with_acts()
    raw = {
        "act": 5,
        "story": {
            "core_message_de": "Abschluss und Klarheit.",
            "user_feeling": "Ruhe",
            "nova_role": "NOVA fasst zusammen",
        },
        "voiceover": {
            "pre_beat_tracks": [
                {
                    "track_id_suffix": "01",
                    "lines": [
                        {"text": "Pre one.", "at_sec": 0, "speaker": "nova"},
                        {"text": "Pre two.", "at_sec": 2, "speaker": "narrator"},
                    ],
                }
            ],
            "beat_track": {
                "track_id_suffix": "02",
                "lines": [
                    {"text": "Line A.", "at_sec": 0, "speaker": "nova"},
                    {"text": "Line B.", "at_sec": 4, "speaker": "nova"},
                ],
            },
        },
    }
    bp = normalize_act_blueprint(raw, profile, 5)
    assert bp["story"]["core_message_en"] == "Abschluss und Klarheit."
    for track in bp["voiceover"]["pre_beat_tracks"] + [bp["voiceover"]["beat_track"]]:
        for line in track["lines"]:
            assert "speaker" not in line
            assert set(line.keys()) <= {"text", "at_sec", "pause_after_sec"}
    from app.pipeline.schema_validate import validate_act_blueprint

    ok, err = validate_act_blueprint(bp)
    assert ok, err


def test_sanitizes_checkion_and_audion_data_viz():
    profile = _profile_with_acts()
    raw3 = {
        "act": 3,
        "data_viz": {
            "mode": "checkion_chart",
            "checkion_chart": {
                "chart_type": "bar",
                "metrics": [{"metric_id": "m1", "label": "Qualität", "trend": "up"}],
            },
        },
    }
    bp3 = normalize_act_blueprint(raw3, profile, 3)
    m = bp3["data_viz"]["checkion_chart"]["metrics"][0]
    assert m["value"] == 50
    assert m["unit"] == "%"
    assert bp3["data_viz"]["checkion_chart"]["chart_type"] == "bar_3d"

    raw4 = {
        "act": 4,
        "data_viz": {
            "mode": "audion_diegetic",
            "audion_diegetic": {
                "metrics": [
                    {
                        "metric_id": "load",
                        "label": "Last",
                        "value": 68,
                        "animation_preset": "pulse",
                    }
                ]
            },
        },
    }
    bp4 = normalize_act_blueprint(raw4, profile, 4)
    assert bp4["data_viz"]["audion_diegetic"]["metrics"][0]["animation_preset"] == "pulse_red"
