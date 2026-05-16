# Persona Reality (TIK)

Open-source **monorepo** for [Persona Reality](https://github.com/chbrdk/TIK) — MSQ DX VR persona immersion (Meta Quest 3) + session composer API.

| Path | Inhalt |
|------|--------|
| **Root** | Specs (`.mdc`), OpenAPI, JSON Schema, golden fixtures, Cursor rules |
| [`unity/`](unity/) | Unity 6 LTS Quest 3 client |
| [`backend/`](backend/) | FastAPI `/v1` session composer (standalone + AUDION integration) |
| [`knowledge/`](knowledge/) | Roadmap, PLEXON integration, URLs |
| [`fixtures/golden/`](fixtures/golden/) | Single source of truth für `scene_config.json` |

## Quick start

```bash
# Schema + golden JSON
npm ci && npm test

# Sync golden → Unity StreamingAssets
./scripts/sync-unity-fixture.sh

# Backend API
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]" && pytest -q
uvicorn app.main:app --reload --port 8000
```

## Unity

Open **`unity/`** in Unity Hub (6000.0.x LTS). See [unity/README.md](unity/README.md).

## Key spec files (repo root)

| File | Purpose |
|------|---------|
| `audion-persona-to-scene.openapi.yaml` | API contract |
| `scene_config.v1.schema.json` | Runtime JSON contract |
| `fixtures/golden/klaus_dortmund_de.json` | Reference session |
| `unity-project-skeleton.md` | Unity architecture reference |

## Related MSQ DX repos

- **AUDION-v2** — production deploy (imports / syncs `backend/` module)
- **CHECKION** — GEO/ranking metrics for Act 3
- **PLEXON** — identity, entitlements, usage events

## License

Apache-2.0 (specs, backend) · MIT ([unity/](unity/LICENSE))
