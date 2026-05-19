# Persona Reality (TIK)

Open-source **monorepo** for [Persona Reality](https://github.com/chbrdk/TIK) — MSQ DX VR persona immersion (Meta Quest 3, **WebXR**) + session composer API.

| Path | Inhalt |
|------|--------|
| **Root** | Specs (`.mdc`), OpenAPI, JSON Schema, golden fixtures |
| [`webxr/`](webxr/) | **Quest 3 WebXR client** (booth runtime) |
| [`backend/`](backend/) | FastAPI `/v1` session composer |
| [`knowledge/`](knowledge/) | Roadmap, image-blaster, WebXR ops |
| [`fixtures/`](fixtures/) | Personas, act blueprints, golden `scene_config` |

## Quick start

```bash
# Schema + fixtures
npm ci && npm test

# WebXR (dev)
cd webxr && npm install && npm run dev

# Sync splat world from image-blaster
WORLD_SLUG=schott-act2-kitchen ./webxr/scripts/sync-world-from-blaster.sh

# Backend API
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]" && pytest -q
uvicorn app.main:app --reload --port 8000
```

## Environments (image-blaster → WebXR)

1. Generate world + anchors in [`../image-blaster`](../image-blaster) — see [knowledge/image-blaster-setup.md](knowledge/image-blaster-setup.md)
2. `WORLD_SLUG=<slug> ./webxr/scripts/sync-world-from-blaster.sh`
3. Quest Browser → `https://<LAN>:5173`

## Key spec files

| File | Purpose |
|------|---------|
| `audion-persona-to-scene.openapi.yaml` | API contract |
| `scene_config.v1.schema.json` | Runtime JSON contract |
| `fixtures/golden/klaus_dortmund_de.json` | Reference session |
| `knowledge/persona-reality-webxr-pilot.md` | WebXR runtime guide |

## Related MSQ DX repos

- **AUDION-v2** — production API host
- **image-blaster** — Gaussian splat authoring (sibling repo)
- **CHECKION** — GEO/ranking metrics for Act 3
- **PLEXON** — identity, entitlements

## License

Apache-2.0 (specs, backend, webxr)
