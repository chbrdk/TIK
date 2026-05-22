from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Callable

from .config import repo_root
from .environment_plate import compose_environment_plate_prompt
from .google_image import generate_scene_preview_image
from .worlds_step import load_act_blueprints, resolve_world_prompt_parts

_PREVIEW_ACTS = (2, 3, 4)
_VOID_PRODUCT_LAYERS = {"onboarding", "closure"}


def _preview_dir(persona_id: str) -> Path:
    return repo_root() / "fixtures/generated" / persona_id / "narrative-previews"


def _public_preview_path(persona_id: str, act_num: int) -> Path:
    return repo_root() / "webxr/public/narrative-previews" / persona_id / f"act-{act_num:02d}.png"


def preview_image_path(persona_id: str, act_num: int) -> Path | None:
    for path in (
        _preview_dir(persona_id) / f"act-{act_num:02d}.png",
        _public_preview_path(persona_id, act_num),
    ):
        if path.is_file():
            return path
    return None


def preview_public_url(persona_id: str, act_num: int) -> str | None:
    if _public_preview_path(persona_id, act_num).is_file():
        return f"/narrative-previews/{persona_id}/act-{act_num:02d}.png"
    return None


def _should_preview_act(blueprint: dict | None, act_num: int) -> bool:
    if act_num not in _PREVIEW_ACTS or not blueprint:
        return False
    meta = blueprint.get("meta") if isinstance(blueprint.get("meta"), dict) else {}
    if meta.get("product_layer") in _VOID_PRODUCT_LAYERS:
        return False
    env = blueprint.get("environment") if isinstance(blueprint.get("environment"), dict) else {}
    if env.get("setting_class", "").startswith("void"):
        return False
    return True


def _publish_preview(source: Path, persona_id: str, act_num: int) -> Path:
    dest = _public_preview_path(persona_id, act_num)
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, dest)
    return dest


async def run_narrative_previews_step(
    persona_id: str,
    profile: dict,
    *,
    skip_existing: bool = True,
    on_progress: Callable[[str], None] | None = None,
) -> list[int]:
    """Generate empty-environment plate PNGs (Acts 2–4) for Marble world source via Gemini."""
    blueprints = load_act_blueprints(persona_id)
    out_root = _preview_dir(persona_id)
    out_root.mkdir(parents=True, exist_ok=True)
    generated: list[int] = []

    for act_num in _PREVIEW_ACTS:
        bp = blueprints.get(act_num)
        if not _should_preview_act(bp, act_num):
            if on_progress:
                on_progress(f"narrative preview act {act_num}: skipped (void or missing)")
            continue

        out_file = out_root / f"act-{act_num:02d}.png"
        if skip_existing and out_file.is_file():
            _publish_preview(out_file, persona_id, act_num)
            generated.append(act_num)
            if on_progress:
                on_progress(f"narrative preview act {act_num}: exists")
            continue

        env = bp.get("environment") if isinstance(bp.get("environment"), dict) else {}
        world_slug = env.get("world_slug", f"act-{act_num}")
        prompt_en, negative, prompt_source = resolve_world_prompt_parts(
            persona_id,
            profile,
            world_slug,
            act_blueprints=blueprints,
        )
        prompt = compose_environment_plate_prompt(
            prompt_en,
            negative_prompt=negative,
            scene_concept_de=env.get("scene_concept_de"),
        )
        if on_progress:
            on_progress(
                f"narrative preview act {act_num}: Gemini environment plate ({prompt_source})"
            )

        await generate_scene_preview_image(
            prompt,
            out_file,
            aspect_ratio="16:9",
            act_num=act_num,
            persona_id=persona_id,
            world_slug=world_slug,
        )
        _publish_preview(out_file, persona_id, act_num)
        generated.append(act_num)

    manifest = {
        "persona_id": persona_id,
        "acts": generated,
        "paths": {str(n): preview_public_url(persona_id, n) for n in generated},
    }
    (out_root / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return generated
