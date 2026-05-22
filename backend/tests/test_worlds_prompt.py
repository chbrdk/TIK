from __future__ import annotations

import json

import pytest

from app.pipeline.worlds_step import (
    _compose_world_prompt,
    _synthesize_anchor_placements,
    find_act_blueprint_path,
    load_act_blueprints,
    resolve_world_prompt,
)


@pytest.fixture
def schott_profile(repo_root):
    path = repo_root / "fixtures/persona-profiles/schott_glasbau_ingenieur_v8.json"
    if not path.is_file():
        pytest.skip("schott profile missing")
    return json.loads(path.read_text(encoding="utf-8"))


def test_compose_world_prompt_appends_negative():
    out = _compose_world_prompt("Main prompt", "kitchen, sofa")
    assert "Main prompt" in out
    assert "Avoid: kitchen, sofa" in out


def test_resolve_prefers_act_blueprint_over_session_arc(schott_profile, repo_root):
    persona_id = schott_profile["meta"]["persona_id"]
    blueprints = load_act_blueprints(persona_id)
    if not blueprints:
        pytest.skip(f"act blueprints missing for {persona_id}")

    slug = "schott-kitchen-morning"
    prompt, source = resolve_world_prompt(
        persona_id,
        schott_profile,
        slug,
        act_blueprints=blueprints,
    )
    assert source.startswith("act_blueprint:")
    assert "planning office" in prompt.lower() or "tablet" in prompt.lower()
    assert "Avoid:" in prompt

    arc_only = dict(schott_profile)
    arc_only["session_arc"]["acts"]["2"]["splat_prompt_en"] = "Short arc-only prompt for testing"
    prompt2, source2 = resolve_world_prompt(persona_id, arc_only, slug, act_blueprints={})
    assert source2 == "session_arc:splat_prompt_en"
    assert prompt2 == "Short arc-only prompt for testing"


def test_find_act_blueprint_path_uses_act_01_not_act_001(tmp_path, monkeypatch):
    monkeypatch.setenv("TIK_REPO_ROOT", str(tmp_path))
    from app.pipeline import config

    monkeypatch.setattr(config, "repo_root", lambda: tmp_path)
    persona_id = "demo_persona"
    base = tmp_path / "fixtures/act-blueprints" / persona_id
    base.mkdir(parents=True)
    (base / "act-01.json").write_text(
        '{"environment":{"world_slug":"kitchen-morning"},"image_prompts":{"splat_world":{"prompt_en":"x"}}}',
        encoding="utf-8",
    )
    path = find_act_blueprint_path(persona_id, "kitchen-morning")
    assert path is not None
    assert path.name == "act-01.json"
    assert path.is_file()


def test_resolve_fallback_slug(schott_profile):
    persona_id = schott_profile["meta"]["persona_id"]
    prompt, source = resolve_world_prompt(persona_id, schott_profile, "nonexistent-world-xyz", act_blueprints={})
    assert source == "fallback:slug"
    assert "nonexistent-world-xyz" in prompt
