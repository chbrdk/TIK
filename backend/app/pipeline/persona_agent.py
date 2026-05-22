from __future__ import annotations

import json
from pathlib import Path

from .claude import complete_json, load_prompt
from .config import repo_root
from .normalize_profile import build_persona_inputs_doc, normalize_persona_profile
from .persona_id import resolve_persona_id
from .schema_validate import validate_persona_inputs, validate_persona_profile

MAX_PERSONA_ATTEMPTS = 3


def profile_persona_id(profile: dict) -> str:
    return (
        profile.get("meta", {}).get("persona_id")
        or profile.get("persona_id")
        or profile.get("persona", {}).get("id")
        or ""
    )


async def generate_persona_profile(
    persona_id: str | None,
    target_audience: str,
    company_name: str,
    company_description: str,
    company_industry: str | None,
    language: str,
    *,
    retry_errors: str | None = None,
) -> dict:
    system = load_prompt("persona_system.md")
    ref_path = repo_root() / "fixtures/persona-profiles/schott_glasbau_ingenieur.json"
    ref_excerpt = ""
    if ref_path.is_file():
        ref = json.loads(ref_path.read_text(encoding="utf-8"))
        arc = ref.get("session_arc", {})
        ref_excerpt = json.dumps(
            {"session_arc_sample_act_2": arc.get("acts", {}).get("2"), "persona_axes": ref.get("persona", {}).get("axes")},
            ensure_ascii=False,
            indent=2,
        )[:3000]

    id_line = (
        f"persona_id (use exactly): {persona_id}"
        if persona_id
        else "persona_id: generate a new unique snake_case id from company + target audience (suffix _v1)."
    )
    user = f"""Create persona_profile for:
{id_line}
language: {language}
target_audience: {target_audience}
company.name: {company_name}
company.description: {company_description}
company.industry: {company_industry or "industrial_b2b"}

Reference excerpt (structure only):
{ref_excerpt}
"""
    if retry_errors:
        user += f"\nPrevious validation failed:\n{retry_errors}\nFix and return valid JSON."

    raw = await complete_json(system, user)
    pid = resolve_persona_id(raw, persona_id)
    draft_inputs = {
        "target_audience": target_audience,
        "company": {
            "name": company_name,
            "description": company_description,
            **({"industry": company_industry} if company_industry else {}),
        },
        "language": language,
        "session_label": company_name,
    }
    return normalize_persona_profile(raw, pid, draft_inputs, language)


def write_persona_fixtures(persona_id: str, profile: dict, inputs: dict) -> None:
    root = repo_root()
    inputs_path = root / "fixtures/persona-inputs" / f"{persona_id}.json"
    profile_path = root / "fixtures/persona-profiles" / f"{persona_id}.json"
    personas_path = root / "fixtures/personas" / f"{persona_id}.json"
    inputs_path.parent.mkdir(parents=True, exist_ok=True)
    # Always write schema-valid inputs (profile.inputs), not raw request blob
    inputs_doc = profile.get("inputs") or inputs
    inputs_path.write_text(json.dumps(inputs_doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    profile_path.write_text(json.dumps(profile, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    p = profile.get("persona", {})
    company = profile.get("company_context") or inputs.get("company", {})
    stub = {
        "id": persona_id,
        "display_name": p.get("display_name", persona_id),
        "occupation": p.get("occupation", ""),
        "location": p.get("location", ""),
        "language": profile.get("language", inputs.get("language", "de")),
        "company_name": company.get("name", inputs.get("company", {}).get("name", "")),
        "company_industry": company.get("industry", "industrial_b2b"),
    }
    personas_path.parent.mkdir(parents=True, exist_ok=True)
    personas_path.write_text(json.dumps(stub, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def validate_persona_bundle(profile: dict, inputs: dict) -> tuple[bool, str]:
    inputs_doc = profile.get("inputs") or inputs
    ok_p, err_p = validate_persona_profile(profile)
    ok_i, err_i = validate_persona_inputs(inputs_doc)
    if ok_p and ok_i:
        return True, ""
    return False, "\n".join(x for x in (err_p, err_i) if x)


async def run_persona_step(
    persona_id: str | None,
    target_audience: str,
    company_name: str,
    company_description: str,
    company_industry: str | None,
    language: str,
) -> dict:
    inputs = build_persona_inputs_doc(
        target_audience,
        company_name,
        company_description,
        company_industry,
        language,
        company_name,
    )
    last_err = ""
    profile: dict = {}
    pid = ""
    for _ in range(MAX_PERSONA_ATTEMPTS):
        profile = await generate_persona_profile(
            persona_id,
            target_audience,
            company_name,
            company_description,
            company_industry,
            language,
            retry_errors=last_err or None,
        )
        pid = profile_persona_id(profile)
        inputs["session_label"] = f"{company_name} — {pid}"
        ok, err = validate_persona_bundle(profile, inputs)
        if ok:
            write_persona_fixtures(pid, profile, inputs)
            return profile
        last_err = err
    raise RuntimeError(f"Persona validation failed after {MAX_PERSONA_ATTEMPTS} attempts:\n{last_err}")
