from __future__ import annotations

import pytest

from app.pipeline.persona_id import ensure_unique_persona_id, is_valid_persona_id, resolve_persona_id


def test_resolve_from_profile():
    profile = {"persona_id": "acme_wartung_v1", "persona": {"id": "wrong"}}
    assert resolve_persona_id(profile, None) == "acme_wartung_v1"


def test_resolve_requested_override():
    profile = {"persona_id": "from_agent", "persona": {"id": "from_agent"}}
    assert resolve_persona_id(profile, "forced_id") == "forced_id"


def test_invalid_persona_id_raises():
    with pytest.raises(ValueError):
        resolve_persona_id({"persona_id": "Bad-ID"}, None)
