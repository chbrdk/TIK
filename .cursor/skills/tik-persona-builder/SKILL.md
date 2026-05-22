---
name: tik-persona-builder
description: >-
  Create a Persona Reality session from two inputs only: target_audience
  (Zielgruppe) and company. Outputs persona_profile JSON with a full session_arc
  (free scene design per act). Use before tik-act-builder when starting a new booth session.
---

# TIK Persona Builder (vorgeschaltet)

**Input (nur 2 Felder):** `target_audience` + `company`  
**Output:** `fixtures/persona-profiles/{persona_id}.json` inkl. **`session_arc`** → danach alle Acts.

## Pipeline

```
persona_inputs.json          persona agent (dieser Skill)
  (Zielgruppe + Company)  →  persona_profile.json  (+ session_arc)
                                      ↓
                         compile-persona-profile.mjs
                                      ↓
                         tik-act-builder × 5 (persona blueprints)
                                      ↓
                         fixtures/generated/{id}/
```

## Schritt 1 — Inputs anlegen

Datei: `fixtures/persona-inputs/{session_slug}.json`

Validieren: `npm run validate:persona-inputs`

## Schritt 2 — Persona Profile schreiben (Agent-Aufgabe)

Datei: `fixtures/persona-profiles/{persona_id}.json`  
Schema: `persona_profile.v1.schema.json`

### Pflichtblöcke

| Block | Inhalt |
|-------|--------|
| `persona` | Figur: Name, Alter, Ort, Beruf, **axes**, pain_points, narrative_hook |
| `company_context` | booth_products, echeon/checkion/audion, suggested_metrics |
| **`session_arc`** | **Komplette Session-Konzeption** — siehe unten |
| `act_data` | Metriken/Headlines für Compile (Acts 2–4) |

### `session_arc` — Kernaufgabe

Lies [references/session-arc.md](references/session-arc.md).

Der Agent **konzipiert alle fünf Acts** inkl. bester Umgebung:

- `throughline_de` / `throughline_en` — eine durchgehende Story
- `day_structure_de` + `anti_patterns_de` — Rhythmus: **Morgen privat → Tag beruflich → Abend privat**; kein Büro-Monoton
- `acts["1".."5"]` — je Act: `scene_concept_de`, `environment_id`, `world_slug`, Anker, Trigger, `splat_prompt_en`

**Nicht** aus `product-default` oder Klaus-Golden Räume übernehmen, außer sie passen wirklich zur Zielgruppe.

### Achsen (canonical)

Aus `01-project-context.mdc`: `sector`, `life_stage`, `tech_affinity`, `decision_style`, `industry`

### Company durch alle Acts

- Act 2: `echeon.headline_templates`
- Act 3: `checkion.suggested_metrics`
- Act 4: `audion.suggested_metrics` + `anchor_object` passend zur **gewählten** Act-4-Szene

## Schritt 3 — Validieren & bauen

```bash
npm run validate:persona-profile
node scripts/compile-persona-profile.mjs --profile <persona_id>
# Acts: tik-act-builder pro Act → fixtures/act-blueprints/<persona_id>/act-0N.json
node scripts/build-session.mjs --profile <persona_id>
```

`build-session` nutzt automatisch `fixtures/act-blueprints/<persona_id>/`, falls vorhanden.

## Referenz

- Golden (legacy Räume): `fixtures/persona-profiles/klaus_dortmund.json`
- Kreativ-Beispiel: `fixtures/persona-profiles/schott_glasbau_ingenieur.json`
- Doku: `knowledge/act-builder-agents.md`

## Danach

→ `tik-act-builder` pro Act: Blueprint aus `session_arc` ausbauen (NOVA, Cues, Bildprompts).
