from __future__ import annotations

import json
import os
import re
from pathlib import Path

from .config import claude_model

_PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"


def require_api_key() -> str:
    key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set")
    return key


def load_prompt(name: str) -> str:
    return (_PROMPTS_DIR / name).read_text(encoding="utf-8")


def extract_json(text: str) -> dict:
    text = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    return json.loads(text)


async def complete_json(system: str, user: str, *, max_tokens: int = 16000) -> dict:
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=require_api_key())
    last_exc: Exception | None = None
    for attempt in range(3):
        try:
            msg = await client.messages.create(
                model=claude_model(),
                max_tokens=max_tokens,
                system=system,
                messages=[{"role": "user", "content": user}],
                timeout=180.0,
            )
            parts = [b.text for b in msg.content if hasattr(b, "text")]
            return extract_json("".join(parts))
        except (anthropic.APIConnectionError, anthropic.RateLimitError, anthropic.APITimeoutError) as e:
            last_exc = e
            if attempt < 2:
                import asyncio

                await asyncio.sleep(2**attempt)
                continue
            raise
    if last_exc:
        raise last_exc
    raise RuntimeError("Claude request failed")
