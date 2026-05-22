from __future__ import annotations

import json
import shutil
import tempfile
from pathlib import Path
from typing import Callable

from .config import blaster_root, repo_root, splat_tier
from .subprocess_runner import run_bash_script, run_node_script


def collect_world_slugs(profile: dict) -> list[str]:
    slugs: list[str] = []
    acts = profile.get("session_arc", {}).get("acts", {})
    for key in sorted(acts.keys(), key=lambda x: int(x)):
        slug = acts[key].get("world_slug")
        if slug and slug not in slugs:
            slugs.append(slug)
    return slugs


def load_act_blueprints(persona_id: str) -> dict[int, dict]:
    """Act number → blueprint JSON (missing acts omitted)."""
    out: dict[int, dict] = {}
    base = repo_root() / "fixtures/act-blueprints" / persona_id
    if not base.is_dir():
        return out
    for n in range(1, 6):
        path = base / f"act-{n:02d}.json"
        if path.is_file():
            out[n] = json.loads(path.read_text(encoding="utf-8"))
    return out


def _compose_world_prompt(prompt_en: str, negative_prompt: str | None = None) -> str:
    text = prompt_en.strip()
    neg = (negative_prompt or "").strip()
    if neg:
        return f"{text}\n\nAvoid: {neg}"
    return text


def _prompt_parts_from_act_blueprint(blueprint: dict) -> tuple[str, str | None] | None:
    image_prompts = blueprint.get("image_prompts")
    if not isinstance(image_prompts, dict):
        return None
    splat = image_prompts.get("splat_world")
    if not isinstance(splat, dict):
        return None
    prompt_en = (splat.get("prompt_en") or "").strip()
    if not prompt_en:
        return None
    neg = (splat.get("negative_prompt") or "").strip() or None
    return prompt_en, neg


def _prompt_from_act_blueprint(blueprint: dict) -> str | None:
    parts = _prompt_parts_from_act_blueprint(blueprint)
    if not parts:
        return None
    prompt_en, neg = parts
    return _compose_world_prompt(prompt_en, neg)


def _prompt_from_session_arc(profile: dict, world_slug: str) -> str | None:
    acts = profile.get("session_arc", {}).get("acts", {})
    if not isinstance(acts, dict):
        return None
    for key in sorted(acts.keys(), key=lambda x: int(x)):
        act = acts[key]
        if not isinstance(act, dict):
            continue
        if act.get("world_slug") != world_slug:
            continue
        prompt = (act.get("splat_prompt_en") or "").strip()
        if prompt:
            return prompt
    return None


def resolve_world_prompt_parts(
    persona_id: str,
    profile: dict,
    world_slug: str,
    *,
    act_blueprints: dict[int, dict] | None = None,
) -> tuple[str, str | None, str]:
    """
    Pick prompt_en + negative_prompt for a world slug (before plate/Marble wrapping).

    Priority: act blueprint image_prompts.splat_world → session_arc.splat_prompt_en → generic.
    Returns (prompt_en, negative_prompt, source_label).
    """
    blueprints = act_blueprints if act_blueprints is not None else load_act_blueprints(persona_id)
    candidates: list[tuple[int, str, str | None]] = []
    for act_num in sorted(blueprints):
        bp = blueprints[act_num]
        env = bp.get("environment") if isinstance(bp.get("environment"), dict) else {}
        if env.get("world_slug") != world_slug and bp.get("world_slug") != world_slug:
            continue
        parts = _prompt_parts_from_act_blueprint(bp)
        if parts:
            candidates.append((act_num, parts[0], parts[1]))

    if candidates:
        act_num, prompt_en, neg = max(candidates, key=lambda x: len(x[1]))
        return prompt_en, neg, f"act_blueprint:act-{act_num:02d}/image_prompts.splat_world"

    arc_prompt = _prompt_from_session_arc(profile, world_slug)
    if arc_prompt:
        return arc_prompt, None, "session_arc:splat_prompt_en"

    return f"Photorealistic immersive 360 environment: {world_slug}", None, "fallback:slug"


def resolve_world_prompt(
    persona_id: str,
    profile: dict,
    world_slug: str,
    *,
    act_blueprints: dict[int, dict] | None = None,
) -> tuple[str, str]:
    """Full Marble text prompt (splat_world + Avoid), not the empty-environment plate variant."""
    prompt_en, neg, source = resolve_world_prompt_parts(
        persona_id, profile, world_slug, act_blueprints=act_blueprints
    )
    return _compose_world_prompt(prompt_en, neg), source


def find_act_blueprint_path(
    persona_id: str,
    world_slug: str,
    act_blueprints: dict[int, dict] | None = None,
) -> Path | None:
    blueprints = act_blueprints if act_blueprints is not None else load_act_blueprints(persona_id)
    for act_num in sorted(blueprints):
        bp = blueprints[act_num]
        env = bp.get("environment") if isinstance(bp.get("environment"), dict) else {}
        if env.get("world_slug") == world_slug or bp.get("world_slug") == world_slug:
            return repo_root() / "fixtures/act-blueprints" / persona_id / f"act-{act_num:02d}.json"
    return None


def _synthesize_anchor_placements(blueprint: dict) -> list[dict]:
    """Derive minimal anchor_placements when the act agent omitted them."""
    seen: set[str] = set()
    out: list[dict] = []
    interaction = blueprint.get("interaction") if isinstance(blueprint.get("interaction"), dict) else {}
    for aid in (interaction.get("primary_anchor"), interaction.get("trigger_target")):
        if isinstance(aid, str) and aid.strip() and aid not in seen:
            seen.add(aid)
            out.append({"anchor_id": aid, "description": aid.replace("_", " ")})
    data_viz = blueprint.get("data_viz")
    if isinstance(data_viz, dict):
        for block in data_viz.values():
            if not isinstance(block, dict):
                continue
            metrics = block.get("metrics") or block.get("chart") or []
            if isinstance(metrics, dict):
                metrics = metrics.get("metrics") or []
            if not isinstance(metrics, list):
                continue
            for m in metrics:
                if not isinstance(m, dict):
                    continue
                aid = m.get("anchor_object")
                if isinstance(aid, str) and aid.strip() and aid not in seen:
                    seen.add(aid)
                    out.append({"anchor_id": aid, "description": aid.replace("_", " ")})
    return out


def _act_blueprint_path_for_init(act_bp: Path) -> tuple[Path, Path | None]:
    """
    Return blueprint path for init-anchors. When anchor_placements are missing,
    write a temporary enriched blueprint (caller must delete temp dir).
    """
    blueprint = json.loads(act_bp.read_text(encoding="utf-8"))
    splat = blueprint.setdefault("image_prompts", {}).setdefault("splat_world", {})
    if splat.get("anchor_placements"):
        return act_bp, None
    synthetic = _synthesize_anchor_placements(blueprint)
    if not synthetic:
        return act_bp, None
    splat["anchor_placements"] = synthetic
    tmp = Path(tempfile.mkdtemp(prefix="tik-act-init-"))
    enriched = tmp / act_bp.name
    enriched.write_text(json.dumps(blueprint, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return enriched, tmp


def _defaults_path(persona_id: str, world_slug: str) -> Path | None:
    root = repo_root()
    for name in (f"{persona_id}_{world_slug.replace('-', '_')}.json", f"{world_slug.replace('-', '_')}.json", f"{persona_id}.json"):
        p = root / "fixtures/world-anchors-defaults" / name
        if p.is_file():
            return p
    return None


def _narrative_preview_for_slug(
    persona_id: str,
    world_slug: str,
    act_blueprints: dict[int, dict],
) -> Path | None:
    from .narrative_previews_step import preview_image_path

    for act_num, bp in act_blueprints.items():
        env = bp.get("environment") if isinstance(bp.get("environment"), dict) else {}
        if env.get("world_slug") == world_slug:
            return preview_image_path(persona_id, act_num)
    return None


def _seed_blaster_source_image(blaster: Path, slug: str, image: Path) -> Path:
    src_dir = blaster / "worlds" / slug / "source"
    src_dir.mkdir(parents=True, exist_ok=True)
    dest = src_dir / "0-scene-preview.png"
    shutil.copy2(image, dest)
    return dest


async def run_worlds_step(
    persona_id: str,
    profile: dict,
    *,
    skip_existing: bool,
    on_progress: Callable[[str], None] | None = None,
    use_narrative_preview_as_source: bool = False,
) -> list[str]:
    blaster = blaster_root()
    slugs = collect_world_slugs(profile)
    total = len(slugs)
    act_blueprints = load_act_blueprints(persona_id)

    for i, slug in enumerate(slugs, 1):
        if on_progress:
            on_progress(f"world {i}/{total}: {slug}")

        world_dir = blaster / "worlds" / slug
        out_world = world_dir / "output/world"
        out_world.mkdir(parents=True, exist_ok=True)

        spz_pattern = list(out_world.glob(f"*-{splat_tier()}.spz")) + list(out_world.glob("0-world*.spz"))
        if skip_existing and spz_pattern:
            if on_progress:
                on_progress(f"skip generate (exists): {slug}")
        else:
            prompt_en, prompt_source = resolve_world_prompt(
                persona_id,
                profile,
                slug,
                act_blueprints=act_blueprints,
            )
            if on_progress:
                on_progress(f"generate {slug} ({prompt_source})")

            import subprocess

            cmd = [
                "node",
                str(blaster / ".claude/scripts/world/generate-world.mjs"),
                "--world",
                slug,
                "--is-pano",
                "--prompt",
                prompt_en,
            ]
            if use_narrative_preview_as_source:
                preview = _narrative_preview_for_slug(persona_id, slug, act_blueprints)
                if preview:
                    plate = _seed_blaster_source_image(blaster, slug, preview)
                    cmd.extend(["--image", str(plate)])
                    if on_progress:
                        on_progress(f"Marble source image: {preview.name}")
            proc = await __import__("asyncio").to_thread(
                subprocess.run,
                cmd,
                cwd=str(blaster),
                capture_output=True,
                text=True,
                timeout=3600,
                check=False,
            )
            if proc.returncode != 0:
                raise RuntimeError(f"generate-world {slug}: {proc.stderr or proc.stdout}")

        act_bp = find_act_blueprint_path(persona_id, slug, act_blueprints=act_blueprints)
        init_tmp: Path | None = None
        init_args = ["--world", slug]
        if act_bp:
            init_bp, init_tmp = _act_blueprint_path_for_init(act_bp)
            init_args.extend(["--from-act-blueprint", str(init_bp)])
        defaults = _defaults_path(persona_id, slug)
        if defaults:
            init_args.extend(["--apply-default-positions", str(defaults)])

        import shutil
        import subprocess

        try:
            init_cmd = ["node", str(blaster / ".claude/scripts/world-anchors/init-anchors.mjs"), *init_args]
            proc = await __import__("asyncio").to_thread(
                subprocess.run,
                init_cmd,
                cwd=str(blaster),
                capture_output=True,
                text=True,
                timeout=120,
                check=False,
            )
            if proc.returncode != 0:
                raise RuntimeError(f"init-anchors {slug}: {proc.stderr or proc.stdout}")
        finally:
            if init_tmp:
                shutil.rmtree(init_tmp, ignore_errors=True)

        manifest_cmd = [
            "node",
            str(blaster / ".claude/scripts/world-anchors/write-world-manifest.mjs"),
            "--world",
            slug,
            "--splat-tier",
            splat_tier(),
        ]
        proc = await __import__("asyncio").to_thread(
            subprocess.run,
            manifest_cmd,
            cwd=str(blaster),
            capture_output=True,
            text=True,
            timeout=120,
            check=False,
        )
        if proc.returncode != 0:
            raise RuntimeError(f"write-world-manifest {slug}: {proc.stderr or proc.stdout}")

        r = await run_bash_script(
            "webxr/scripts/sync-world-from-blaster.sh",
            {"WORLD_SLUG": slug, "IMAGE_BLASTER_ROOT": str(blaster), "SPLAT_TIER": splat_tier()},
        )
        if r.returncode != 0:
            raise RuntimeError(f"sync-world {slug}: {r.stderr or r.stdout}")

    return slugs
