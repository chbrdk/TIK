from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, patch

from app.pipeline.narrative_previews_step import (
    preview_public_url,
    run_narrative_previews_step,
)


def test_run_narrative_previews_calls_google(tmp_path, monkeypatch):
    monkeypatch.setenv("TIK_REPO_ROOT", str(tmp_path))
    from app.pipeline import config

    monkeypatch.setattr(config, "repo_root", lambda: tmp_path)

    persona_id = "test_preview_persona"
    profile = {
        "session_arc": {
            "acts": {
                "2": {"world_slug": "kitchen-morning", "splat_prompt_en": "Kitchen morning scene"},
            }
        }
    }
    act_dir = tmp_path / "fixtures/act-blueprints" / persona_id
    act_dir.mkdir(parents=True)
    (act_dir / "act-02.json").write_text(
        '{"meta":{"product_layer":"echeon"},"act":2,'
        '"environment":{"world_slug":"kitchen-morning","setting_class":"residential_morning"},'
        '"image_prompts":{"splat_world":{"prompt_en":"Cozy kitchen morning 360"}}}',
        encoding="utf-8",
    )

    async def fake_google(prompt, output_path, **_kwargs):
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(b"png")
        return output_path

    with patch(
        "app.pipeline.narrative_previews_step.generate_scene_preview_image",
        new_callable=AsyncMock,
        side_effect=fake_google,
    ) as mock_gen:
        acts = asyncio.run(
            run_narrative_previews_step(persona_id, profile, skip_existing=False)
        )

    assert acts == [2]
    mock_gen.assert_awaited_once()
    prompt = mock_gen.await_args.args[0]
    assert "Cozy kitchen morning" in prompt
    assert "environment plate" in prompt.lower()
    pub = tmp_path / "webxr/public/narrative-previews" / persona_id / "act-02.png"
    assert pub.is_file()
    assert preview_public_url(persona_id, 2) == f"/narrative-previews/{persona_id}/act-02.png"
