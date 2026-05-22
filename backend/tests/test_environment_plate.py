from __future__ import annotations

from app.pipeline.environment_plate import compose_environment_plate_prompt
from app.pipeline.narrative_previews_step import run_narrative_previews_step
from app.pipeline.worlds_step import resolve_world_prompt_parts
from unittest.mock import AsyncMock, patch
import asyncio


def test_compose_environment_plate_strips_narrative_focus():
    base = (
        "Man at kitchen table with tablet showing dashboard, coffee mug, morning light."
    )
    out = compose_environment_plate_prompt(
        base,
        negative_prompt="office, factory",
        scene_concept_de="Küche um 7 Uhr, warmes Fensterlicht, ruhige Wohnung.",
    )
    assert "environment plate" in out.lower()
    assert "No people" in out
    assert "Man at kitchen" in out
    assert "Küche um 7 Uhr" in out
    assert "office, factory" in out
    assert "people, person" in out


def test_narrative_preview_uses_plate_prompt(tmp_path, monkeypatch):
    monkeypatch.setenv("TIK_REPO_ROOT", str(tmp_path))
    from app.pipeline import config

    monkeypatch.setattr(config, "repo_root", lambda: tmp_path)

    persona_id = "plate_persona"
    profile = {
        "session_arc": {
            "acts": {
                "2": {
                    "world_slug": "kitchen-morning",
                    "splat_prompt_en": "Kitchen morning",
                }
            }
        }
    }
    act_dir = tmp_path / "fixtures/act-blueprints" / persona_id
    act_dir.mkdir(parents=True)
    (act_dir / "act-02.json").write_text(
        '{"meta":{"product_layer":"echeon"},"act":2,'
        '"environment":{"world_slug":"kitchen-morning","setting_class":"residential",'
        '"scene_concept_de":"Leere moderne Küche, Morgenlicht durch Fenster."},'
        '"image_prompts":{"splat_world":{"prompt_en":"Modern kitchen morning light",'
        '"negative_prompt":"people, office"}}}',
        encoding="utf-8",
    )

    captured: list[str] = []

    async def fake_google(prompt, output_path, **_kwargs):
        captured.append(prompt)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(b"png")
        return output_path

    with patch(
        "app.pipeline.narrative_previews_step.generate_scene_preview_image",
        new_callable=AsyncMock,
        side_effect=fake_google,
    ):
        asyncio.run(run_narrative_previews_step(persona_id, profile, skip_existing=False))

    assert captured
    assert "environment plate" in captured[0].lower()
    assert "No people" in captured[0]


def test_resolve_world_prompt_parts_returns_negative(tmp_path, monkeypatch):
    monkeypatch.setenv("TIK_REPO_ROOT", str(tmp_path))
    from app.pipeline import config

    monkeypatch.setattr(config, "repo_root", lambda: tmp_path)
    persona_id = "p1"
    act_dir = tmp_path / "fixtures/act-blueprints" / persona_id
    act_dir.mkdir(parents=True)
    (act_dir / "act-02.json").write_text(
        '{"act":2,"environment":{"world_slug":"slug-a"},'
        '"image_prompts":{"splat_world":{"prompt_en":"Room A","negative_prompt":"people"}}}',
        encoding="utf-8",
    )
    en, neg, src = resolve_world_prompt_parts(persona_id, {}, "slug-a")
    assert en == "Room A"
    assert neg == "people"
    assert "act_blueprint" in src
