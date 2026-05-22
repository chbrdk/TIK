from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

from .config import repo_root

_MAX_ERROR_LINES = 10


@lru_cache(maxsize=8)
def _validator(schema_name: str) -> Draft202012Validator:
    path = repo_root() / schema_name
    schema = json.loads(path.read_text(encoding="utf-8"))
    return Draft202012Validator(schema)


def format_validation_errors(errors: list[Any], *, max_lines: int = _MAX_ERROR_LINES) -> str:
    lines: list[str] = []
    for err in errors[:max_lines]:
        path = "/".join(str(p) for p in err.path) if err.path else "(root)"
        lines.append(f"{path}: {err.message}")
    if len(errors) > max_lines:
        lines.append(f"... and {len(errors) - max_lines} more")
    return "\n".join(lines)


def _validate(data: dict[str, Any], schema_name: str) -> tuple[bool, str]:
    validator = _validator(schema_name)
    errors = sorted(validator.iter_errors(data), key=lambda e: list(e.path))
    if not errors:
        return True, ""
    return False, format_validation_errors(errors)


def validate_act_blueprint(data: dict[str, Any]) -> tuple[bool, str]:
    return _validate(data, "act_blueprint.v1.schema.json")


def validate_persona_profile(data: dict[str, Any]) -> tuple[bool, str]:
    return _validate(data, "persona_profile.v1.schema.json")


def validate_persona_inputs(data: dict[str, Any]) -> tuple[bool, str]:
    return _validate(data, "persona_inputs.v1.schema.json")


def validate_act_blueprint_file(path: Path) -> tuple[bool, str]:
    if not path.is_file():
        return False, f"missing file: {path}"
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return False, f"invalid JSON: {e}"
    ok, err = validate_act_blueprint(data)
    if not ok:
        return False, f"{path.name}: {err}"
    return True, ""


def validate_all_act_blueprints(persona_id: str) -> tuple[bool, str]:
    act_dir = repo_root() / "fixtures/act-blueprints" / persona_id
    if not act_dir.is_dir():
        return False, f"missing act directory: {act_dir}"
    errors: list[str] = []
    for n in range(1, 6):
        path = act_dir / f"act-0{n}.json"
        ok, err = validate_act_blueprint_file(path)
        if not ok:
            errors.append(err)
    if errors:
        return False, "\n".join(errors)
    return True, ""
