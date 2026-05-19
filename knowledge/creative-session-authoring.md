# Creative session authoring (agent-first)

Stand: Mai 2026

## Prinzip

**Kein fester Raum-Katalog.** Der Persona-Agent konzipiert pro Session:

1. **Throughline** — eine Geschichte in 5 Minuten
2. **Pro Act** — bester Ort, Tageszeit, Anker, Trigger, Splat-Prompt

Die MSQ-Produkte (echeon, CHECKION, AUDION) bleiben als **dramaturgische Jobs**; **Küche/Büro/Sofa** sind nur eine mögliche Lösung (z. B. Hausverwalter), nicht der Default.

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

- Act 2: Planungstisch + Tablet (nicht Küchen-Handy)
- Act 3: Ingenieurbüro + Monitor
- Act 4: Projektraum Abend + Normenordner

Welten in image-blaster unter `world_slug` aus `session_arc` anlegen und nach WebXR syncen.
