from __future__ import annotations

from app.pipeline.normalize_profile import (
    build_persona_inputs_doc,
    ensure_target_audience,
    normalize_persona_profile,
)


def test_ensure_target_audience_min_length():
    assert len(ensure_target_audience("kurz", "Porsche AG", "Automotive")) >= 10


def test_household_object_coerced_or_omitted():
    raw = {
        "persona": {
            "display_name": "Alex",
            "occupation": "Einkauf",
            "location": "Stuttgart",
            "household": {"spouse": "ja", "children": 2},
            "axes": {
                "sector": "b2b",
                "life_stage": "x",
                "tech_affinity": "x",
                "decision_style": "x",
                "industry": "auto",
            },
        },
        "session_arc": {"acts": {}},
    }
    inputs = build_persona_inputs_doc("Einkäufer Industrie", "Porsche", "Desc", None, "de", "Porsche")
    p = normalize_persona_profile(raw, "porsche_test_v1", inputs, "de")
    assert "household" in p["persona"]
    assert isinstance(p["persona"]["household"], str)
    assert len(p["inputs"]["target_audience"]) >= 10
