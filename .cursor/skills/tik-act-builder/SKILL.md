---
name: tik-act-builder
description: >-
  Build or regenerate one Persona Reality act (1–5): free scene design from
  session_arc, NOVA speech, splat prompts, metrics, timeline. Outputs act_blueprint
  JSON per persona. Use after tik-persona-builder.
---

# TIK Act Builder

Build **one act** from **`session_arc`** → vollständiger `act_blueprint` → compiled bundle.

## When to use

- User asks to write/rebuild Act 1–5
- After `tik-persona-builder` created `session_arc`
- Speech, environment, image prompts, metrics for one act

**Prerequisite:** `fixtures/persona-profiles/{persona_id}.json` mit **`session_arc`**.

## Workflow per act

1. Read `session_arc.acts[N]` + [references/act-core-matrix.md](references/act-core-matrix.md) (nur Produkt-Job)
2. Read act brief `references/act-0N-brief.md` für Daten-Viz-Regeln
3. **Nicht** `product-default` als Raum-Vorlage kopieren
4. Schreibe `fixtures/act-blueprints/{persona_id}/act-0N.json` (vollständig, schema-valide)
5. Validate & compile:

```bash
npm run validate:act-blueprint
node scripts/compile-act-blueprint.mjs --act N --persona <id> --profile <id>
```

## Szene frei gestalten

Aus `session_arc` in den Blueprint übernehmen und **ausbauen**:

| Feld | Quelle |
|------|--------|
| `environment.environment_id` | `session_arc` |
| `environment.world_slug` | `session_arc` |
| `environment.scene_concept_de` | `session_arc` (erweitern) |
| `interaction.trigger_*` | `session_arc` (dynamisch, nicht immer `pickup`/`phone_main`) |
| `image_prompts.splat_world` | `splat_prompt_en` aus Arc verfeinern + `anchor_placements` |
| `story` / `voiceover` | Zur Szene passend, persona-spezifisch |

**Erlaubt:** Baustelle, Labor, Messestand, Fahrzeug, Werkhalle, Planungstisch, …  
**Vermeiden:** Küche/Büro/Sofa nur aus Gewohnheit.

## Blueprint contract

Schema: `act_blueprint.v1.schema.json`

- **story** — core_message, user_feeling, nova_role (zur gewählten Szene)
- **environment** — `environment_id`, `world_slug`, `scene_concept_de` (Pflicht)
- **image_prompts.splat_world** — `prompt_en`, anchors, negatives
- **voiceover** — NOVA zwischen Handlungen
- **data_viz** — mode je Act (echeon / checkion / audion / none / qr)
- **timeline** — cues passend zu Trigger und Raum

## Persona placeholders

`{{persona.display_name}}`, `{{persona.occupation}}`, `{{persona.location}}`, `{{company.name}}`

## Commands

```bash
node scripts/build-session.mjs --profile <persona_id>
```

Outputs: `fixtures/generated/{persona}/act-NN-bundle.json`, `environment-bindings.json`

## NOVA

- Calm, precise, nicht salesy · DE default · Tracks `nova_de_act{N}_01|02`

## Do not

- Hardcode URLs
- Live APIs am Stand
- `environment_id_example` oder Klaus-Räume ohne narrative Begründung
- product-default als Copy-Paste für environment/story

## Further reading

- `knowledge/act-builder-agents.md`
- `knowledge/creative-session-authoring.md`
- `scene_config.v1.schema.json`
