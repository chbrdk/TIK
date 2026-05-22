from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .config import repo_root
from .environment_plate import compose_environment_plate_prompt
from .narrative_previews_step import preview_public_url
from .worlds_step import load_act_blueprints, resolve_world_prompt, resolve_world_prompt_parts


def _act_blueprint_path(persona_id: str, act_num: int) -> Path:
    return repo_root() / "fixtures/act-blueprints" / persona_id / f"act-{act_num:02d}.json"


def _voiceover_lines(blueprint: dict) -> list[dict[str, Any]]:
    lines_out: list[dict[str, Any]] = []
    vo = blueprint.get("voiceover")
    if not isinstance(vo, dict):
        return lines_out

    for track in vo.get("pre_beat_tracks") or []:
        if not isinstance(track, dict):
            continue
        suffix = track.get("track_id_suffix", "")
        for line in track.get("lines") or []:
            if not isinstance(line, dict):
                continue
            text = (line.get("text") or "").strip()
            if not text:
                continue
            lines_out.append(
                {
                    "phase": "pre_beat",
                    "track_suffix": suffix,
                    "at_sec": line.get("at_sec", 0),
                    "pause_after_sec": line.get("pause_after_sec"),
                    "text": text,
                }
            )

    beat = vo.get("beat_track")
    if isinstance(beat, dict):
        suffix = beat.get("track_id_suffix", "")
        for line in beat.get("lines") or []:
            if not isinstance(line, dict):
                continue
            text = (line.get("text") or "").strip()
            if not text:
                continue
            lines_out.append(
                {
                    "phase": "beat",
                    "track_suffix": suffix,
                    "at_sec": line.get("at_sec", 0),
                    "pause_after_sec": line.get("pause_after_sec"),
                    "text": text,
                }
            )
    return lines_out


def _splat_prompt_fields(blueprint: dict) -> dict[str, Any]:
    image_prompts = blueprint.get("image_prompts")
    if not isinstance(image_prompts, dict):
        return {}
    splat = image_prompts.get("splat_world")
    if not isinstance(splat, dict):
        return {}
    return {
        "prompt_en": (splat.get("prompt_en") or "").strip() or None,
        "negative_prompt": (splat.get("negative_prompt") or "").strip() or None,
        "camera_notes": (splat.get("camera_notes") or "").strip() or None,
        "slug_hint": (splat.get("slug_hint") or "").strip() or None,
        "anchor_placements": [
            {"anchor_id": p.get("anchor_id", ""), "description": p.get("description")}
            for p in (splat.get("anchor_placements") or [])
            if isinstance(p, dict) and p.get("anchor_id")
        ],
    }


def load_act_creative_detail(
    persona_id: str,
    act_num: int,
    *,
    profile: dict | None = None,
    blueprint: dict | None = None,
    act_blueprints: dict[int, dict] | None = None,
) -> dict[str, Any] | None:
    if blueprint is None:
        path = _act_blueprint_path(persona_id, act_num)
        if not path.is_file():
            return None
        blueprint = json.loads(path.read_text(encoding="utf-8"))

    env = blueprint.get("environment") if isinstance(blueprint.get("environment"), dict) else {}
    story = blueprint.get("story") if isinstance(blueprint.get("story"), dict) else {}
    meta = blueprint.get("meta") if isinstance(blueprint.get("meta"), dict) else {}
    world_slug = env.get("world_slug")

    splat = _splat_prompt_fields(blueprint)
    world_prompt_resolved: str | None = None
    world_prompt_source: str | None = None
    preview_plate_prompt: str | None = None
    if profile and world_slug:
        world_prompt_resolved, world_prompt_source = resolve_world_prompt(
            persona_id,
            profile,
            world_slug,
            act_blueprints=act_blueprints,
        )
        if act_num in (2, 3, 4):
            prompt_en, neg, _ = resolve_world_prompt_parts(
                persona_id,
                profile,
                world_slug,
                act_blueprints=act_blueprints,
            )
            preview_plate_prompt = compose_environment_plate_prompt(
                prompt_en,
                negative_prompt=neg,
                scene_concept_de=env.get("scene_concept_de"),
            )

    return {
        "act": act_num,
        "blueprint_path": f"fixtures/act-blueprints/{persona_id}/act-{act_num:02d}.json",
        "exists": True,
        "product_layer": meta.get("product_layer"),
        "world_slug": world_slug,
        "environment_id": env.get("environment_id"),
        "scene_concept_de": env.get("scene_concept_de"),
        "core_message_de": story.get("core_message_de"),
        "nova_role": story.get("nova_role"),
        "voiceover_lines": _voiceover_lines(blueprint),
        "beat_duration_sec": (
            (blueprint.get("voiceover") or {}).get("beat_track", {}).get("estimated_duration_sec")
            if isinstance(blueprint.get("voiceover"), dict)
            else None
        ),
        **splat,
        "world_prompt_resolved": world_prompt_resolved,
        "world_prompt_source": world_prompt_source,
        "preview_plate_prompt": preview_plate_prompt,
        "preview_image_url": preview_public_url(persona_id, act_num),
    }


def load_persona_acts_creative(persona_id: str) -> dict[str, Any]:
    """Structured act review payload for API / Studio (voiceover + world prompts)."""
    profile_path = repo_root() / "fixtures/persona-profiles" / f"{persona_id}.json"
    profile: dict | None = None
    if profile_path.is_file():
        profile = json.loads(profile_path.read_text(encoding="utf-8"))

    blueprints = load_act_blueprints(persona_id)
    acts: list[dict[str, Any]] = []
    for n in range(1, 6):
        detail = load_act_creative_detail(
            persona_id,
            n,
            profile=profile,
            act_blueprints=blueprints,
            blueprint=blueprints.get(n),
        )
        if detail:
            acts.append(detail)
        else:
            acts.append(
                {
                    "act": n,
                    "blueprint_path": f"fixtures/act-blueprints/{persona_id}/act-{n:02d}.json",
                    "exists": False,
                }
            )

    return {
        "persona_id": persona_id,
        "acts": acts,
    }
