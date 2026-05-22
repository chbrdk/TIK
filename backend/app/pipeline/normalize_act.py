from __future__ import annotations

import copy
import re
from typing import Any

from .normalize_profile import _as_str

_PRODUCT_LAYER = {1: "onboarding", 2: "echeon", 3: "checkion", 4: "audion", 5: "closure"}
_DATA_VIZ_MODE = {1: "none", 2: "echeon_feed", 3: "checkion_chart", 4: "audion_diegetic", 5: "qr_closure"}
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
    "ui_interact",
}
_ENV_KEYS = {
    "environment_id",
    "world_slug",
    "scene_concept_de",
    "setting_class",
    "style_hint",
    "region_hint",
    "time_of_day",
    "lighting_preset",
}
_CUE_KEYS = {
    "type",
    "at_sec",
    "delay_from_beat",
    "track_id",
    "anchor_object",
    "metric_id",
    "animation_preset",
    "ambient_audio_id",
    "action",
    "duration_sec",
    "mode",
    "pattern",
}
_MODE_IN = {"in", "fade_in", "fade_in_slow", "slow_in", "fadein"}
_MODE_OUT = {"out", "fade_out", "fade_out_slow", "slow_out", "fadeout"}


def _arc_act(profile: dict, act_num: int) -> dict[str, Any]:
    return (profile.get("session_arc") or {}).get("acts", {}).get(str(act_num), {}) or {}


def _default_story(act_num: int, persona: dict, company: dict) -> dict[str, Any]:
    name = _as_str(persona.get("display_name"), "Persona")
    co = _as_str(company.get("name"), "Company")
    return {
        "core_message_de": f"Act {act_num}: Erlebnis aus Sicht von {name} bei {co}.",
        "core_message_en": f"Act {act_num}: experience as {name} at {co}.",
        "user_feeling": "fokussiert, neugierig",
        "nova_role": "sachlich einladend, zwischen Beats kurz sprechen",
    }


def _sanitize_story(raw: Any, act_num: int, persona: dict, company: dict) -> dict[str, str]:
    base = _default_story(act_num, persona, company)
    if not isinstance(raw, dict):
        return base
    de = _as_str(
        raw.get("core_message_de")
        or raw.get("message_de")
        or raw.get("core_message")
        or raw.get("summary_de")
        or raw.get("summary"),
        base["core_message_de"],
    ).strip()
    if len(de) < 1:
        de = base["core_message_de"]
    en = _as_str(
        raw.get("core_message_en") or raw.get("message_en") or raw.get("summary_en"),
        "",
    ).strip()
    if len(en) < 1:
        en = de if len(de) >= 1 else base["core_message_en"]
    feeling = _as_str(
        raw.get("user_feeling") or raw.get("feeling") or raw.get("emotion"),
        base["user_feeling"],
    ).strip()
    if len(feeling) < 1:
        feeling = base["user_feeling"]
    nova = _as_str(raw.get("nova_role") or raw.get("nova_voice") or raw.get("nova"), base["nova_role"]).strip()
    if len(nova) < 1:
        nova = base["nova_role"]
    return {
        "core_message_de": de[:2000],
        "core_message_en": en[:2000],
        "user_feeling": feeling[:500],
        "nova_role": nova[:500],
    }


def _environment_from_arc(arc: dict[str, Any], act_num: int) -> dict[str, Any]:
    slug = _as_str(arc.get("world_slug"), f"void-{'mirror' if act_num == 1 else 'constellation'}")
    slug = re.sub(r"[^a-z0-9-]", "-", slug.lower()).strip("-")
    env_id = _as_str(arc.get("environment_id"))
    if not env_id.startswith("env_"):
        env_id = f"env_{slug.replace('-', '_')}"[:48]
    lighting = arc.get("lighting_preset")
    if lighting not in _VALID_LIGHTING:
        lighting = "void_minimal" if act_num in (1, 5) else "afternoon_golden"
    concept = _as_str(arc.get("scene_concept_de") or arc.get("scene_summary_de"))
    if len(concept) < 20:
        concept = f"Immersive Szene für Act {act_num}: {slug}. Industrielle Persona-Reality-Demo."
    return {
        "environment_id": env_id,
        "world_slug": slug,
        "scene_concept_de": concept[:800],
        "setting_class": _as_str(arc.get("setting_class"), "workplace"),
        "style_hint": _as_str(arc.get("style_hint"), ""),
        "region_hint": _as_str(arc.get("region_hint"), "dach"),
        "time_of_day": _as_str(arc.get("time_of_day"), "neutral"),
        "lighting_preset": lighting,
    }


def _sanitize_environment(env: dict[str, Any], act_num: int, arc: dict[str, Any]) -> dict[str, Any]:
    base = _environment_from_arc(arc, act_num)
    merged = {**base, **{k: env[k] for k in _ENV_KEYS if k in env}}
    lighting = merged.get("lighting_preset")
    if lighting not in _VALID_LIGHTING:
        merged["lighting_preset"] = base["lighting_preset"]
    if len(_as_str(merged.get("scene_concept_de"))) < 20:
        merged["scene_concept_de"] = base["scene_concept_de"]
    slug = _as_str(merged.get("world_slug"), base["world_slug"])
    merged["world_slug"] = re.sub(r"[^a-z0-9-]", "-", slug.lower()).strip("-")
    env_id = _as_str(merged.get("environment_id"), base["environment_id"])
    if not env_id.startswith("env_"):
        env_id = f"env_{merged['world_slug'].replace('-', '_')}"[:48]
    merged["environment_id"] = env_id
    return merged


def _sanitize_anchor_placement(item: Any, fallback_id: str) -> dict[str, str] | None:
    if not isinstance(item, dict):
        return None
    aid = (
        item.get("anchor_id")
        or item.get("id")
        or item.get("object_id")
        or item.get("object")
        or item.get("name")
    )
    aid = _as_str(aid, "").strip()
    if not aid:
        return None
    aid = re.sub(r"[^a-z0-9_]", "_", aid.lower()).strip("_")
    desc = _as_str(
        item.get("description") or item.get("desc") or item.get("label") or item.get("role"),
        f"Anchor {aid.replace('_', ' ')}",
    )
    return {"anchor_id": aid or fallback_id, "description": desc[:200]}


def _sanitize_splat_world(
    raw: dict[str, Any] | None,
    env: dict[str, Any],
    arc: dict[str, Any],
    fallback_anchor: str,
) -> dict[str, Any]:
    base = _image_prompts(env, arc)["splat_world"]
    if not isinstance(raw, dict):
        return base
    prompt = _as_str(raw.get("prompt_en") or raw.get("prompt"), base["prompt_en"])
    if len(prompt) < 20:
        prompt = base["prompt_en"]
    neg = _as_str(
        raw.get("negative_prompt")
        or raw.get("negative_prompt_en")
        or raw.get("negative")
        or base.get("negative_prompt"),
        base["negative_prompt"],
    )
    placements: list[dict[str, str]] = []
    for item in raw.get("anchor_placements") or []:
        p = _sanitize_anchor_placement(item, fallback_anchor)
        if p and p["anchor_id"] not in {x["anchor_id"] for x in placements}:
            placements.append(p)
    if not placements:
        placements = base["anchor_placements"]
    out: dict[str, Any] = {
        "slug_hint": _as_str(raw.get("slug_hint"), env["world_slug"]),
        "prompt_en": prompt[:1200],
        "negative_prompt": neg[:800],
        "anchor_placements": placements,
    }
    cam = _as_str(raw.get("camera_notes"), "")
    if cam:
        out["camera_notes"] = cam[:400]
    return out


def _sanitize_image_prompts(
    raw: dict[str, Any] | None,
    env: dict[str, Any],
    arc: dict[str, Any],
    fallback_anchor: str,
) -> dict[str, Any]:
    base = _image_prompts(env, arc)
    if not isinstance(raw, dict):
        return base
    splat_raw = raw.get("splat_world") if isinstance(raw.get("splat_world"), dict) else None
    out: dict[str, Any] = {
        "splat_world": _sanitize_splat_world(splat_raw, env, arc, fallback_anchor),
        "prop_notes": _as_str(raw.get("prop_notes"), base.get("prop_notes", "")),
    }
    return out


def _image_prompts(env: dict[str, Any], arc: dict[str, Any]) -> dict[str, Any]:
    slug = env["world_slug"]
    prompt = _as_str(arc.get("splat_prompt_en"))
    if len(prompt) < 20:
        prompt = (
            f"Photorealistic immersive 360 interior, {slug}, industrial B2B, "
            "high detail, cinematic lighting"
        )
    anchor = _as_str(arc.get("primary_anchor") or arc.get("trigger_target"), "focus_point")
    return {
        "splat_world": {
            "slug_hint": slug,
            "prompt_en": prompt[:1200],
            "negative_prompt": _as_str(
                arc.get("negative_prompt_en"),
                "kitchen, sofa, living room, blurry, text, logos",
            ),
            "camera_notes": "Eye-level, user-facing focal anchor",
            "anchor_placements": [
                {"anchor_id": anchor, "description": f"Primary interaction anchor for {slug}"}
            ],
        },
        "prop_notes": _as_str(arc.get("prop_notes"), ""),
    }


def _sanitize_track_id_suffix(raw: Any, default: str) -> str:
    """Schema requires exactly two digits, e.g. 01 — not act01_intro_voice."""
    if isinstance(raw, int):
        return f"{raw:02d}"[-2:]
    text = _as_str(raw, "")
    match = re.search(r"(\d{2})", text)
    if match:
        return match.group(1)
    match = re.search(r"(\d+)", text)
    if match:
        n = int(match.group(1))
        return f"{n % 100:02d}"
    return default if re.fullmatch(r"\d{2}", default) else "01"


def _sanitize_voiceover_line(line: Any) -> dict[str, Any] | None:
    if not isinstance(line, dict):
        return None
    text = _as_str(
        line.get("text") or line.get("line") or line.get("content") or line.get("speech"),
        "",
    ).strip()
    if not text:
        return None
    at = line.get("at_sec")
    out: dict[str, Any] = {
        "text": text,
        "at_sec": float(at if isinstance(at, (int, float)) else 0),
    }
    pause = line.get("pause_after_sec")
    if isinstance(pause, (int, float)):
        out["pause_after_sec"] = float(pause)
    return out


def _sanitize_track(track: Any, default_suffix: str) -> dict[str, Any]:
    if not isinstance(track, dict):
        return {
            "track_id_suffix": default_suffix,
            "estimated_duration_sec": 16,
            "lines": [{"text": "…", "at_sec": 0, "pause_after_sec": 0.5}],
        }
    suffix = _sanitize_track_id_suffix(track.get("track_id_suffix"), default_suffix)
    lines = []
    for line in track.get("lines") or []:
        sanitized = _sanitize_voiceover_line(line)
        if sanitized:
            lines.append(sanitized)
    if not lines:
        lines = [{"text": "…", "at_sec": 0, "pause_after_sec": 0.5}]
    dur = track.get("estimated_duration_sec")
    return {
        "track_id_suffix": suffix,
        "estimated_duration_sec": float(dur if isinstance(dur, (int, float)) else 16),
        "lines": lines,
    }


def _sanitize_voiceover(vo: dict[str, Any], act_num: int) -> dict[str, Any]:
    pre_default = "01"
    beat_default = "02" if act_num > 1 else "01"
    pre_raw = [] if act_num == 1 else (
        vo.get("pre_beat_tracks") if isinstance(vo.get("pre_beat_tracks"), list) else []
    )
    pre_tracks = []
    for i, track in enumerate(pre_raw):
        if isinstance(track, dict):
            pre_tracks.append(_sanitize_track(track, pre_default if i == 0 else f"{i + 1:02d}"))
    beat_raw = vo.get("beat_track") if isinstance(vo.get("beat_track"), dict) else {}
    return {
        "pre_beat_tracks": pre_tracks,
        "beat_track": _sanitize_track(beat_raw, beat_default),
    }


def _voiceover_from_raw(raw: dict[str, Any], act_num: int) -> dict[str, Any]:
    vo = raw.get("voiceover")
    if isinstance(vo, dict) and vo.get("beat_track"):
        return _sanitize_voiceover(vo, act_num)
    # Legacy / mistaken shapes
    nova = raw.get("nova_speech") or raw.get("nova")
    if isinstance(nova, dict):
        lines = nova.get("lines") or []
        if lines:
            return _sanitize_voiceover(
                {
                    "pre_beat_tracks": [],
                    "beat_track": {
                        "track_id_suffix": f"{act_num:02d}",
                        "estimated_duration_sec": 14,
                        "lines": lines,
                    },
                },
                act_num,
            )
    suffix_beat = f"{act_num:02d}"
    return _sanitize_voiceover(
        {
        "pre_beat_tracks": [] if act_num == 1 else [
            {
                "track_id_suffix": "01",
                "estimated_duration_sec": 18,
                "lines": [
                    {"text": "Der nächste Moment beginnt.", "at_sec": 0, "pause_after_sec": 0.5},
                    {"text": "Alles ist auf deine Rolle zugeschnitten.", "at_sec": 5, "pause_after_sec": 0.5},
                ],
            }
        ],
        "beat_track": {
            "track_id_suffix": suffix_beat if act_num > 1 else "01",
            "estimated_duration_sec": 16,
            "lines": [
                {
                    "text": "Willkommen in Persona Reality." if act_num == 1 else "Hier siehst du, was als Nächstes zählt.",
                    "at_sec": 0,
                    "pause_after_sec": 0.5,
                }
            ],
        },
    },
        act_num,
    )


def _interaction_from_arc(arc: dict[str, Any], env: dict[str, Any]) -> dict[str, Any]:
    trigger = arc.get("trigger_type")
    if trigger not in _VALID_TRIGGERS:
        trigger = "scene_enter" if arc.get("act") in (1, 5) else "look_at"
    anchor = _as_str(arc.get("primary_anchor") or arc.get("trigger_target"), "focus_point")
    return {
        "trigger_type": trigger,
        "trigger_target": _as_str(arc.get("trigger_target"), anchor),
        "primary_anchor": anchor,
        "delay_sec": 0,
        "haptic_pattern": "none" if arc.get("act") == 1 else "soft_pulse",
    }


_VALID_ANIMATION = {"glow_warm", "pulse_red", "flicker", "color_shift", "particle_burst", "scale_breath"}


def _sanitize_metric(m: dict[str, Any]) -> dict[str, Any]:
    return {
        "label": _as_str(m.get("label"), "Metric"),
        "value": float(m.get("value", 50) if isinstance(m.get("value"), (int, float)) else 50),
        "unit": _as_str(m.get("unit"), "%"),
        **({"trend": m["trend"]} if m.get("trend") in ("up", "down", "flat") else {}),
        **({"rationale_de": _as_str(m["rationale_de"])} if m.get("rationale_de") else {}),
    }


def _sanitize_diegetic_metric(m: dict[str, Any], anchor: str) -> dict[str, Any]:
    preset = m.get("animation_preset")
    if preset == "pulse":
        preset = "pulse_red"
    if preset not in _VALID_ANIMATION:
        preset = "glow_warm"
    return {
        "metric_id": _as_str(m.get("metric_id"), "metric_1"),
        "label": _as_str(m.get("label"), "Wert"),
        "value": float(m.get("value", 50) if isinstance(m.get("value"), (int, float)) else 50),
        "unit": _as_str(m.get("unit"), "%"),
        "anchor_object": _as_str(m.get("anchor_object"), anchor),
        "animation_preset": preset,
    }


def _data_viz_from_raw(raw: dict[str, Any], act_num: int, anchor: str) -> dict[str, Any]:
    mode = _DATA_VIZ_MODE[act_num]
    dv = raw.get("data_viz") if isinstance(raw.get("data_viz"), dict) else {}
    if dv.get("mode") == mode or mode == "none":
        pass
    else:
        dv = {}
    if mode == "echeon_feed":
        ef = dv.get("echeon_feed") if isinstance(dv.get("echeon_feed"), dict) else {}
        return {
            "mode": mode,
            "echeon_feed": {
                "item_count": int(ef.get("item_count", 3) or 3),
                "categories": ef.get("categories") or ["industry", "operations"],
                "headline_templates": ef.get("headline_templates") or [],
            },
        }
    if mode == "checkion_chart":
        cc = dv.get("checkion_chart") if isinstance(dv.get("checkion_chart"), dict) else {}
        metrics_raw = cc.get("metrics") if isinstance(cc.get("metrics"), list) else []
        metrics = [_sanitize_metric(m) for m in metrics_raw if isinstance(m, dict)] or [
            _sanitize_metric({"label": "Sichtbarkeit", "value": 72, "unit": "%", "trend": "up"})
        ]
        chart_type = cc.get("chart_type") if cc.get("chart_type") in ("bar_3d", "bar_2d") else "bar_3d"
        return {"mode": mode, "checkion_chart": {"chart_type": chart_type, "metrics": metrics[:4]}}
    if mode == "audion_diegetic":
        ad = dv.get("audion_diegetic") if isinstance(dv.get("audion_diegetic"), dict) else {}
        metrics_raw = ad.get("metrics") if isinstance(ad.get("metrics"), list) else []
        metrics = [
            _sanitize_diegetic_metric(m, anchor)
            for m in metrics_raw
            if isinstance(m, dict)
        ] or [_sanitize_diegetic_metric({}, anchor)]
        return {"mode": mode, "audion_diegetic": {"metrics": metrics}}
    if mode == "qr_closure":
        return {"mode": mode, "qr_closure": {"anchor_object": anchor or "qr_panel"}}
    return {"mode": "none"}


def _normalize_cue_mode(raw: Any, cue: dict[str, Any]) -> str | None:
    if raw is None:
        if cue.get("action") == "stop":
            return "out"
        if cue.get("action") == "start":
            return "in"
        return None
    m = _as_str(raw, "").lower().replace(" ", "_")
    if m in _MODE_IN:
        return "in"
    if m in _MODE_OUT:
        return "out"
    if "out" in m:
        return "out"
    if "in" in m:
        return "in"
    return None


def _sanitize_cue(cue: Any, default_type: str, at_sec: float) -> dict[str, Any]:
    if not isinstance(cue, dict):
        return {"type": default_type, "at_sec": at_sec}
    cue_type = cue.get("type")
    if not cue_type and cue.get("action") in ("start", "stop"):
        cue_type = "fade"
    if not cue_type and cue.get("cue_id"):
        cue_type = default_type
    out: dict[str, Any] = {
        "type": _as_str(cue_type, default_type),
        "at_sec": float(cue.get("at_sec") if isinstance(cue.get("at_sec"), (int, float)) else at_sec),
    }
    for key in _CUE_KEYS:
        if key in ("type", "at_sec"):
            continue
        if key not in cue or cue[key] is None:
            continue
        if key == "mode":
            mode = _normalize_cue_mode(cue.get("mode"), cue)
            if mode:
                out["mode"] = mode
            continue
        if key == "action":
            if cue[key] in ("start", "stop"):
                out["action"] = cue[key]
            continue
        out[key] = cue[key]
    if out["type"] == "fade" and "mode" not in out:
        mode = _normalize_cue_mode(None, cue)
        if mode:
            out["mode"] = mode
        else:
            out["mode"] = "in"
    return out


def _sanitize_cue_list(cues: Any, defaults: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not isinstance(cues, list) or not cues:
        return defaults
    out = []
    for i, c in enumerate(cues):
        default_type = defaults[min(i, len(defaults) - 1)]["type"] if defaults else "subtitle"
        at = defaults[min(i, len(defaults) - 1)].get("at_sec", i * 4) if defaults else i * 4
        sanitized = _sanitize_cue(c, default_type, float(at))
        out.append(sanitized)
    if not any(c.get("type") == "act_advance" for c in out):
        out.append({"type": "act_advance", "at_sec": out[-1]["at_sec"] + 8})
    return out


def _timeline_from_raw(raw: dict[str, Any], act_num: int, duration: float = 16, anchor: str = "focus_point") -> dict[str, Any]:
    defaults_pre = [{"type": "subtitle", "track_id": "PLACEHOLDER", "at_sec": 0}]
    defaults_beat = [
        {"type": "subtitle", "track_id": "PLACEHOLDER", "at_sec": 0},
        {"type": "act_advance", "at_sec": duration},
    ]
    if act_num == 2:
        defaults_pre = [
            {"type": "subtitle", "track_id": "PLACEHOLDER", "at_sec": 0},
            {"type": "hint_primary", "anchor_object": anchor, "at_sec": min(18, duration * 0.4)},
        ]
        defaults_beat = [
            {"type": "overlay_show", "at_sec": 4, "delay_from_beat": True},
            {"type": "act_advance", "at_sec": duration},
        ]
    tl = raw.get("timeline") if isinstance(raw.get("timeline"), dict) else {}
    target = float(tl.get("target_duration_sec") or duration)
    return {
        "target_duration_sec": target,
        "ambient_audio_id": tl.get("ambient_audio_id"),
        "pre_beat_cues": _sanitize_cue_list(tl.get("pre_beat_cues"), defaults_pre),
        "beat_cue_templates": _sanitize_cue_list(tl.get("beat_cue_templates"), defaults_beat),
    }


def normalize_act_blueprint(raw: dict[str, Any], profile: dict[str, Any], act_num: int) -> dict[str, Any]:
    """Map Claude output → act_blueprint.v1 (meta, story, environment, … only)."""
    persona_id = (profile.get("meta") or {}).get("persona_id") or profile.get("persona", {}).get("id", "persona")
    lang = (profile.get("meta") or {}).get("language", "de")
    if lang not in ("de", "en"):
        lang = "de"
    arc = _arc_act(profile, act_num)
    persona = profile.get("persona") or {}
    company = profile.get("company_context") or {}

    raw_env = raw.get("environment") if isinstance(raw.get("environment"), dict) else {}
    env = _sanitize_environment({**raw_env}, act_num, arc)

    story = _sanitize_story(raw.get("story"), act_num, persona, company)
    voiceover = _voiceover_from_raw(raw, act_num)
    dur = float(voiceover.get("beat_track", {}).get("estimated_duration_sec") or 16)
    anchor = _as_str(
        (raw.get("interaction") or {}).get("primary_anchor")
        or arc.get("primary_anchor")
        or arc.get("trigger_target"),
        "focus_point",
    )
    raw_ip = raw.get("image_prompts") if isinstance(raw.get("image_prompts"), dict) else None

    return {
        "meta": {
            "blueprint_id": _as_str((raw.get("meta") or {}).get("blueprint_id"), f"{persona_id}_act_{act_num:02d}"),
            "schema_version": "1.0",
            "language": lang,
            "product_layer": _PRODUCT_LAYER[act_num],
        },
        "act": act_num,
        "story": story,
        "environment": env,
        "image_prompts": _sanitize_image_prompts(raw_ip, env, arc, anchor),
        "voiceover": voiceover,
        "interaction": _interaction_from_arc({**arc, **(raw.get("interaction") or {})}, env),
        "data_viz": _data_viz_from_raw(raw, act_num, anchor),
        "timeline": _timeline_from_raw(raw, act_num, dur, anchor),
    }
