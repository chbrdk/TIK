# Creative session authoring (agent-first)

Stand: Mai 2026

## Prinzip

**Kein fester Raum-Katalog.** Der Persona-Agent konzipiert pro Session:

1. **Throughline** — eine Geschichte in 5 Minuten
2. **Pro Act** — bester Ort, Tageszeit, Anker, Trigger, Splat-Prompt

Die MSQ-Produkte (echeon, CHECKION, AUDION) bleiben als **dramaturgische Jobs**.

**Tagesrhythmus (Default):** Act 2 Morgen **privat**, Act 3 Tag **beruflich**, Act 4 Abend **privat** — Company-Kontext in Story & Daten, aber **nicht** fünf Firmen-Räume hintereinander.

## Datenfluss

```
persona_inputs (Zielgruppe + Company)
  → persona_profile.session_arc     ← Persona-Agent (tik-persona-builder)
  → act_blueprints/{persona}/       ← Act-Agent (tik-act-builder)
  → fixtures/generated/.../environment-bindings.json
  → scene_config.environments[].world_slug  → WebXR lädt Splats
```

## Schema

| Datei | Rolle |
|-------|--------|
| `persona_profile.v1.schema.json` | `session_arc` Pflicht |
| `act_blueprint.v1.schema.json` | `environment.world_slug`, `scene_concept_de` |
| `scene_config.v1.schema.json` | optional `world_slug` pro Act |

## Skills

- `.cursor/skills/tik-persona-builder/` — Session erfinden
- `.cursor/skills/tik-act-builder/` — Acts aus `session_arc` ausbauen

## Beispiel Schott

`fixtures/persona-profiles/schott_glasbau_ingenieur.json`:

- Act 2: **Morgen privat** — Küche/Frühstück + Tablet (echeon), nicht Planungsbüro
- Act 3: **Tag beruflich** — Ingenieurbüro + Monitor (checkion)
- Act 4: **Abend privat** — Esstisch/Homeoffice (audion), nicht Firmen-Projektraum

Welten in image-blaster unter `world_slug` aus `session_arc` anlegen und nach WebXR syncen.
