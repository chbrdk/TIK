from __future__ import annotations

import copy
import json
import re
from typing import Any

_PRODUCT_LAYER_BY_ACT = {
    1: "onboarding",
    2: "echeon",
    3: "checkion",
    4: "audion",
    5: "closure",
}

_VALID_LIGHTING = {
    "morning_warm",
    "midday_neutral",
    "afternoon_golden",
    "evening_warm",
    "night_cool",
    "void_minimal",
}
_VALID_TRIGGERS = {
    "timer",
    "look_at",
    "pickup",
    "sit_down",
    "stand_up",
    "scene_enter",
    "proximity",
}
_VALID_GENDER = {"male", "female", "androgynous"}
_VALID_INCOME = {"low", "mid", "upper_mid", "high", "uhnw"}
_MIN_TARGET_AUDIENCE_LEN = 10


def _as_str(value: Any, default: str = "") -> str:
    if value is None:
        return default
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, dict):
        for key in ("description", "label", "text", "name", "de"):
            if key in value and value[key]:
                return _as_str(value[key])
        return json.dumps(value, ensure_ascii=False)[:240]
    if isinstance(value, list):
        parts = [_as_str(x) for x in value[:6] if _as_str(x)]
        return ", ".join(parts) if parts else default
    return default


def ensure_target_audience(target_audience: str, company_name: str, company_description: str) -> str:
    """persona_inputs.v1 requires target_audience minLength 10."""
    ta = _as_str(target_audience)
    if len(ta) >= _MIN_TARGET_AUDIENCE_LEN:
        return ta
    parts = [p for p in (ta, _as_str(company_name), _as_str(company_description)[:120]) if p]
    combined = " — ".join(parts) if parts else "Messe-Zielgruppe B2B DACH"
    if len(combined) < _MIN_TARGET_AUDIENCE_LEN:
        combined = f"{combined} Industrie-Entscheider"
    return combined[:2000]


def _string_list(value: Any, *, max_items: int = 5) -> list[str]:
    if not isinstance(value, list):
        return []
    out: list[str] = []
    for item in value:
        s = _as_str(item)
        if s and s not in out:
            out.append(s)
        if len(out) >= max_items:
            break
    return out


def _sanitize_persona(persona: dict[str, Any], persona_id: str, industry: str) -> dict[str, Any]:
    p = copy.deepcopy(persona)
    out: dict[str, Any] = {
        "id": persona_id,
        "display_name": _as_str(p.get("display_name"), persona_id),
        "occupation": _as_str(p.get("occupation"), "Fachkraft"),
        "location": _as_str(p.get("location"), "DACH"),
        "axes": {
            "sector": _as_str((p.get("axes") or {}).get("sector"), "b2b_specialist"),
            "life_stage": _as_str((p.get("axes") or {}).get("life_stage"), "established_career"),
            "tech_affinity": _as_str((p.get("axes") or {}).get("tech_affinity"), "pragmatic"),
            "decision_style": _as_str((p.get("axes") or {}).get("decision_style"), "rational"),
            "industry": _as_str((p.get("axes") or {}).get("industry"), industry or "industrial_b2b"),
        },
    }
    age = p.get("age")
    if isinstance(age, (int, float)):
        out["age"] = max(18, min(99, int(age)))
    gender = p.get("gender_expression")
    if gender in _VALID_GENDER:
        out["gender_expression"] = gender
    income = p.get("income_band")
    if income in _VALID_INCOME:
        out["income_band"] = income
    household = _as_str(p.get("household"))
    if household:
        out["household"] = household
    pain = _string_list(p.get("pain_points"))
    if pain:
        out["pain_points"] = pain
    drivers = _string_list(p.get("decision_drivers"))
    if drivers:
        out["decision_drivers"] = drivers
    for key in ("narrative_hook_de", "narrative_hook_en"):
        val = _as_str(p.get(key))
        if val:
            out[key] = val
    return out


def _slug_env_id(world_slug: str, act: int) -> str:
    base = re.sub(r"[^a-z0-9_]", "_", world_slug.replace("-", "_"))
    return f"env_{base}_act{act}"[:48]


def _fix_act(act_num: int, act: dict[str, Any]) -> dict[str, Any]:
    out = copy.deepcopy(act)
    layer = _PRODUCT_LAYER_BY_ACT[act_num]
    out["product_layer"] = layer
    if act_num in (1, 5):
        out["lighting_preset"] = "void_minimal"
        if out.get("trigger_type") not in _VALID_TRIGGERS:
            out["trigger_type"] = "scene_enter"
    elif out.get("lighting_preset") not in _VALID_LIGHTING:
        out["lighting_preset"] = {
            2: "morning_warm",
            3: "midday_neutral",
            4: "evening_warm",
        }.get(act_num, "afternoon_golden")
    if out.get("trigger_type") not in _VALID_TRIGGERS:
        out["trigger_type"] = "look_at"
    slug = out.get("world_slug") or f"void-{'mirror' if act_num == 1 else 'constellation'}"
    out["world_slug"] = re.sub(r"[^a-z0-9-]", "-", str(slug).lower()).strip("-")
    if not out.get("environment_id", "").startswith("env_"):
        out["environment_id"] = _slug_env_id(out["world_slug"], act_num)
    for key in ("dramatic_beat_de", "scene_concept_de", "time_of_day", "primary_anchor", "trigger_target"):
        val = _as_str(out.get(key), "—")
        if key == "scene_concept_de" and len(val) < 30:
            val = (val + " Immersive industrial environment for persona reality demo.").strip()[:500]
        if key == "dramatic_beat_de" and len(val) < 10:
            val = (val + " Einstieg in die Session.").strip()[:300]
        out[key] = val
    prompt = _as_str(out.get("splat_prompt_en"))
    if len(prompt) < 40:
        prompt = (
            f"Photorealistic immersive 360 environment, act {act_num}, "
            f"{out['world_slug']}, industrial B2B, high detail"
        )
    out["splat_prompt_en"] = prompt[:1200]
    setting_default = {
        2: "residential_morning",
        3: "workplace_day",
        4: "residential_evening",
    }.get(act_num, "workplace")
    out["setting_class"] = _as_str(out.get("setting_class"), setting_default)
    return out


def build_persona_inputs_doc(
    target_audience: str,
    company_name: str,
    company_description: str,
    company_industry: str | None,
    language: str,
    session_label: str,
) -> dict[str, Any]:
    company: dict[str, Any] = {
        "name": _as_str(company_name, "Company"),
        "description": _as_str(company_description, "Messe-Demo"),
    }
    if company_industry:
        company["industry"] = _as_str(company_industry)
    return {
        "target_audience": ensure_target_audience(target_audience, company_name, company_description),
        "company": company,
        "language": language if language in ("de", "en") else "de",
        "session_label": _as_str(session_label, company_name),
    }


def normalize_persona_profile(
    raw: dict[str, Any],
    persona_id: str,
    inputs: dict[str, Any],
    language: str,
) -> dict[str, Any]:
    """Map Claude output to persona_profile.v1 top-level shape (meta, inputs, persona, …)."""
    company_in = inputs.get("company") or {}
    industry = _as_str(company_in.get("industry"), "industrial_b2b")

    inputs_doc = build_persona_inputs_doc(
        _as_str(inputs.get("target_audience")),
        _as_str(company_in.get("name")),
        _as_str(company_in.get("description")),
        company_in.get("industry"),
        language,
        _as_str(inputs.get("session_label"), company_in.get("name", "")),
    )

    persona = _sanitize_persona(raw.get("persona") or {}, persona_id, industry)

    company = copy.deepcopy(raw.get("company_context") or raw.get("company") or company_in)
    if isinstance(company, dict):
        company["name"] = _as_str(company.get("name"), inputs_doc["company"]["name"])
        booth = company.get("booth_products") or ["echeon", "checkion", "audion"]
        company["booth_products"] = [p for p in booth if p in ("echeon", "checkion", "audion")] or [
            "echeon",
            "checkion",
            "audion",
        ]
        if company.get("industry") is not None:
            company["industry"] = _as_str(company.get("industry"), industry)
    else:
        company = {
            "name": inputs_doc["company"]["name"],
            "booth_products": ["echeon", "checkion", "audion"],
        }

    session_arc = copy.deepcopy(raw.get("session_arc") or {})
    acts_in = session_arc.get("acts") or {}
    acts_out: dict[str, Any] = {}
    for n in range(1, 6):
        key = str(n)
        acts_out[key] = _fix_act(n, acts_in.get(key) or {})
    session_arc["acts"] = acts_out
    tl_de = _as_str(session_arc.get("throughline_de"))
    tl_en = _as_str(session_arc.get("throughline_en"))
    session_arc["throughline_de"] = tl_de if len(tl_de) >= 20 else f"Fünf Akte aus Sicht von {persona['display_name']} bei {company['name']}."
    session_arc["throughline_en"] = tl_en if len(tl_en) >= 20 else "Five-act persona reality session for trade fair demo."

    act_data = raw.get("act_data") if isinstance(raw.get("act_data"), dict) else {}

    display = persona.get("display_name") or persona_id
    return {
        "meta": {
            "persona_id": persona_id,
            "schema_version": "1.0",
            "language": language if language in ("de", "en") else "de",
            "display_title": _as_str((raw.get("meta") or {}).get("display_title"))
            or f"{display} · {persona.get('occupation', '')}".strip(" ·"),
        },
        "inputs": inputs_doc,
        "persona": persona,
        "company_context": company,
        "session_arc": session_arc,
        "act_data": act_data,
    }
