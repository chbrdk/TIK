# Persona Reality (TIK)

Open-source **specification repository** for [Persona Reality](https://github.com/chbrdk/TIK) — MSQ DX's VR persona immersion experience (Meta Quest 3).

This repo is the **contract source of truth**. Runtime code lives in sibling repos:

| Repo | Status |
|------|--------|
| [TIK](https://github.com/chbrdk/TIK) (here) | Specs, OpenAPI, JSON Schema, golden fixtures |
| `persona-reality-unity` | *planned* — Unity 6 Quest client |
| `AUDION-v2` | *planned* — `/v1` session composer module |
| `persona-reality-companion` | *planned* — iPad booth app |

## Quick start

```bash
npm ci
npm test   # validates fixtures against scene_config.v1.schema.json
```

## Key files

| File | Purpose |
|------|---------|
| `audion-persona-to-scene.openapi.yaml` | AUDION API contract |
| `scene_config.v1.schema.json` | Runtime JSON contract (Unity + AUDION) |
| `fixtures/golden/klaus_dortmund_de.json` | Reference session for Klaus (DE) |
| `unity-project-skeleton.md` | Unity architecture |
| `knowledge/implementation-roadmap-2026.md` | Full build plan (June 2026) |
| `knowledge/repos-and-urls.md` | Central URL registry — do not hardcode elsewhere |
| `knowledge/plexon-integration.md` | PLEXON federation hooks |

## Cursor rules

`.mdc` files in the repo root are Cursor agent rules for Unity and AUDION development.

## License

Apache-2.0 — see [LICENSE](LICENSE).
