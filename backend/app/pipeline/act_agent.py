from __future__ import annotations

import asyncio
import json
from pathlib import Path

from .claude import complete_json, load_prompt
from .config import repo_root
from .normalize_act import normalize_act_blueprint
from .persona_agent import profile_persona_id
from .schema_validate import validate_act_blueprint, validate_all_act_blueprints

MAX_ACT_ATTEMPTS = 3


async def generate_act_blueprint(profile: dict, act_num: int, *, retry_errors: str | None = None) -> dict:
    system = load_prompt("act_system.md")
    persona_id = profile_persona_id(profile)
    arc_act = profile.get("session_arc", {}).get("acts", {}).get(str(act_num), {})
    ref_dir = repo_root() / "fixtures/act-blueprints/sick_instandhaltung_lebensmittel_v1"
    ref_file = ref_dir / f"act-0{act_num}.json"
    ref_excerpt = ""
    if ref_file.is_file():
        ref_excerpt = ref_file.read_text(encoding="utf-8")[:4000]

    company = profile.get("company_context", profile.get("company", {}))
    user = f"""Build act_blueprint for act {act_num}, persona_id {persona_id}.

session_arc act:
{json.dumps(arc_act, ensure_ascii=False, indent=2)}

persona (axes, pain_points, decision_drivers, narrative_hook — drive ALL feelings and reactions):
{json.dumps(profile.get("persona", {}), ensure_ascii=False, indent=2)[:2500]}

company_context (use echeon/checkion/audion use_case_persona as TOUCHPOINT content — never as spoken product names):
{json.dumps(company, ensure_ascii=False, indent=2)[:2000]}

persona_origin: {company.get("persona_origin_de", "Abbild aus Audion-Profilmustern der Zielgruppe.")}

Reference act structure (do not copy content verbatim):
{ref_excerpt}
"""
    if retry_errors:
        user += f"\nSchema validation errors (fix all):\n{retry_errors}\n"

    raw = await complete_json(system, user, max_tokens=12000)
    return normalize_act_blueprint(raw, profile, act_num)


def write_act_blueprint(persona_id: str, act_num: int, blueprint: dict) -> Path:
    out_dir = repo_root() / "fixtures/act-blueprints" / persona_id
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"act-0{act_num}.json"
    path.write_text(json.dumps(blueprint, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


async def _generate_validated_act(profile: dict, act_num: int) -> dict:
    last_err = ""
    for _ in range(MAX_ACT_ATTEMPTS):
        bp = await generate_act_blueprint(profile, act_num, retry_errors=last_err or None)
        ok, err = validate_act_blueprint(bp)
        if ok:
            return bp
        last_err = err
    raise RuntimeError(f"Act {act_num} validation failed after {MAX_ACT_ATTEMPTS} attempts:\n{last_err}")


async def run_act_step(profile: dict) -> None:
    persona_id = profile_persona_id(profile)

    async def one(act_num: int) -> None:
        bp = await _generate_validated_act(profile, act_num)
        write_act_blueprint(persona_id, act_num, bp)

    await one(1)
    await asyncio.gather(*[one(n) for n in range(2, 6)])

    ok, err = validate_all_act_blueprints(persona_id)
    if not ok:
        raise RuntimeError(f"Act blueprints failed final validation:\n{err}")
