# Act Builder Agents

**Ziel:** Aus **Zielgruppe + Company** eine komplette Messe-Session — Persona-Agent konzipiert die **Story + Szenen**, Act-Agents liefern Ausführung.

## Architektur

```
persona_inputs (2 Felder)
        ↓  tik-persona-builder  →  session_arc (freie Szenen pro Act)
persona_profile.json
        ↓  tik-act-builder × 5  →  act-blueprints/{persona}/act-0N.json
        ↓  compile-act-blueprint.mjs
fixtures/generated/{id}/  (+ environment-bindings.json)
```

### Persona Agent

- Erfindet **Throughline** und **Acts 1–5** inkl. `environment_id`, `world_slug`, Trigger, `splat_prompt_en`
- Siehe `knowledge/creative-session-authoring.md`

### Act Agents

- Lesen `session_arc.acts[N]` — **kein** Küche/Büro/Sofa-Zwang
- Schreiben persona-spezifische Blueprints unter `fixtures/act-blueprints/{persona_id}/`
- `product-default` nur noch Legacy-Referenz, nicht als Raum-Vorlage

## Commands

```bash
npm run validate:persona-profile
npm run validate:act-blueprint
node scripts/build-session.mjs --profile <persona_id>
node scripts/test-session-arc-compile.mjs
```

## Neue Session

1. `fixtures/persona-inputs/<slug>.json`
2. Persona-Agent → `persona-profiles/<slug>.json` **mit session_arc**
3. Act-Agent × 5 → `act-blueprints/<slug>/`
4. `build-session.mjs`
5. image-blaster Welten für jeden `world_slug` → WebXR sync
