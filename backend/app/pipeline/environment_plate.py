from __future__ import annotations

"""Compose Gemini / Marble source prompts as empty environment plates (no narrative scene)."""

_STANDARD_PLATE_AVOID = (
    "people, person, human figure, silhouette, crowd, portrait, face, hands, "
    "readable text, logo, watermark, UI overlay, HUD, dashboard on screen, "
    "speech bubble, comic panel, storyboard, cinematic action scene, "
    "multiple focal characters, product advertisement with model"
)

_PLATE_PREFIX = (
    "Empty photorealistic environment plate for 3D Gaussian splat world generation. "
    "Architecture and atmosphere only: walls, floors, windows, lighting, materials, "
    "generic furniture without narrative staging. "
    "No people, no human silhouettes, no faces, no hands. "
    "No readable text, logos, UI screens, dashboards, or QR codes. "
    "Wide establishing interior or exterior view, clean sightlines, 360-friendly. "
    "Setting:"
)

_PLATE_SUFFIX = (
    " Output style: empty architectural reference photo for world capture, "
    "not a movie still with actors or a marketing scene with models."
)


def compose_environment_plate_prompt(
    base_prompt_en: str,
    *,
    negative_prompt: str | None = None,
    scene_concept_de: str | None = None,
) -> str:
    """
    Wrap splat_world prompt_en as an empty-environment source image brief.

    Used for Gemini narrative previews that seed Marble `--image` generation.
    """
    setting = (base_prompt_en or "").strip()
    concept = (scene_concept_de or "").strip()
    if concept and len(concept) >= 20:
        setting = (
            f"{setting}\n"
            f"Spatial layout (architecture only, do not add people or story props): {concept[:500]}"
        ).strip()
    body = f"{_PLATE_PREFIX}\n{setting}\n{_PLATE_SUFFIX}".strip()
    avoid_parts = [_STANDARD_PLATE_AVOID]
    extra = (negative_prompt or "").strip()
    if extra:
        avoid_parts.append(extra)
    return f"{body}\n\nAvoid: {', '.join(avoid_parts)}"
