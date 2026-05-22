from __future__ import annotations

import re

from .config import repo_root

_PERSONA_ID_RE = re.compile(r"^[a-z][a-z0-9_]*$")


def is_valid_persona_id(value: str) -> bool:
    return bool(_PERSONA_ID_RE.match(value)) and len(value) <= 64


def persona_id_exists(persona_id: str) -> bool:
    root = repo_root()
    return (root / "fixtures/persona-profiles" / f"{persona_id}.json").is_file()


def ensure_unique_persona_id(base: str) -> str:
    """Append _v2, _v3, … if profile fixture already exists."""
    if not is_valid_persona_id(base):
        raise ValueError(f"Invalid persona_id from agent: {base!r}")
    if not persona_id_exists(base):
        return base
    for n in range(2, 100):
        candidate = f"{base}_v{n}" if not base.endswith("_v1") else f"{base[:-3]}_v{n}"
        if len(candidate) > 64:
            candidate = f"{base[:50]}_v{n}"
        if is_valid_persona_id(candidate) and not persona_id_exists(candidate):
            return candidate
    raise RuntimeError(f"No free persona_id variant for {base}")


def resolve_persona_id(profile: dict, requested: str | None) -> str:
    if requested:
        pid = requested.strip()
    else:
        pid = (profile.get("persona_id") or profile.get("persona", {}).get("id") or "").strip()
    if not is_valid_persona_id(pid):
        raise ValueError(f"persona_id must be snake_case (got {pid!r})")
    return ensure_unique_persona_id(pid)
