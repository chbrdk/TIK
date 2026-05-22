from __future__ import annotations

import asyncio
import base64
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from .config import gemini_image_model, google_api_key


def _extract_image_bytes(response: Any) -> bytes:
    candidates = getattr(response, "candidates", None) or []
    for candidate in candidates:
        content = getattr(candidate, "content", None)
        if not content:
            continue
        for part in content.parts or []:
            inline = getattr(part, "inline_data", None)
            if not inline:
                continue
            data = inline.data
            if isinstance(data, bytes):
                return data
            if isinstance(data, str):
                return base64.b64decode(data)
    raise RuntimeError("Gemini image model returned no image bytes")


def _write_request_meta(
    output_path: Path,
    *,
    model: str,
    prompt: str,
    act_num: int | None,
    persona_id: str | None,
    world_slug: str | None,
) -> None:
    meta_path = output_path.parent / f".act-{act_num:02d}-preview-request.json" if act_num else output_path.parent / ".preview-request.json"
    meta_path.write_text(
        json.dumps(
            {
                "schema_version": 1,
                "kind": "narrative_preview",
                "provider": "google-gemini",
                "model": model,
                "status": "completed",
                "submitted_at": datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
                "prompt": prompt[:2000],
                "act": act_num,
                "persona_id": persona_id,
                "world_slug": world_slug,
                "output": str(output_path.name),
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


def generate_scene_preview_image_sync(
    prompt: str,
    output_path: Path,
    *,
    aspect_ratio: str = "16:9",
    act_num: int | None = None,
    persona_id: str | None = None,
    world_slug: str | None = None,
) -> Path:
    from google import genai
    from google.genai import types

    api_key = google_api_key()
    model = gemini_image_model()
    client = genai.Client(api_key=api_key)

    config = types.GenerateContentConfig(
        response_modalities=["IMAGE"],
        image_config=types.ImageConfig(aspect_ratio=aspect_ratio),
    )
    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=config,
    )
    image_bytes = _extract_image_bytes(response)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(image_bytes)
    _write_request_meta(
        output_path,
        model=model,
        prompt=prompt,
        act_num=act_num,
        persona_id=persona_id,
        world_slug=world_slug,
    )
    return output_path


async def generate_scene_preview_image(
    prompt: str,
    output_path: Path,
    *,
    aspect_ratio: str = "16:9",
    act_num: int | None = None,
    persona_id: str | None = None,
    world_slug: str | None = None,
) -> Path:
    return await asyncio.to_thread(
        generate_scene_preview_image_sync,
        prompt,
        output_path,
        aspect_ratio=aspect_ratio,
        act_num=act_num,
        persona_id=persona_id,
        world_slug=world_slug,
    )
