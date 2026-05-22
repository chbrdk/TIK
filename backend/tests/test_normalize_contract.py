from __future__ import annotations

import json

import pytest

from app.pipeline.normalize_act import normalize_act_blueprint
from app.pipeline.schema_validate import validate_act_blueprint


@pytest.fixture
def schott_profile(repo_root):
    path = repo_root / "fixtures/persona-profiles/schott_glasbau_ingenieur_v8.json"
    if not path.is_file():
        pytest.skip("schott profile missing")
    return json.loads(path.read_text(encoding="utf-8"))


def test_normalize_fixes_invalid_claude_timeline(schott_profile):
    raw = {
        "act": 3,
        "data_viz": {
            "mode": "checkion_chart",
            "checkion_chart": {
                "chart_type": "bar",
                "metrics": [{"metric_id": "m1", "label": "Q", "trend": "up"}],
            },
        },
        "timeline": {
            "pre_beat_cues": [{"cue_id": "c1", "action": "start", "description": "x", "at_sec": 0}],
            "beat_cue_templates": [{"cue_id": "b1", "action": "show", "at_sec": 4}],
        },
    }
    bp = normalize_act_blueprint(raw, schott_profile, 3)
    ok, err = validate_act_blueprint(bp)
    assert ok, err
