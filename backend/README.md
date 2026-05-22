# Persona Reality API (`/v1`)

Standalone FastAPI service from the TIK monorepo. Implements `audion-persona-to-scene.openapi.yaml`.

## Run locally

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
export PYTHONPATH=.
uvicorn app.main:app --reload --port 8000
```

```bash
curl -X POST http://localhost:8000/v1/sessions \
  -H "Content-Type: application/json" \
  -d '{"persona_id":"klaus_dortmund","language":"de"}'
```

## Tests

```bash
cd backend && pytest -q
```

Golden fixtures and schema live at the **repo root** (`fixtures/golden/`, `scene_config.v1.schema.json`).

## Persona Reality Studio (Pipeline)

Admin UI lives in `webxr` at `/admin`. API routes under `/v1/pipeline/`.

| Endpoint | Beschreibung |
|----------|----------------|
| `POST /v1/pipeline/sessions` | Startet Job (persona → acts → **narrative previews** → compile → optional worlds → publish) |
| `GET /v1/pipeline/jobs` | Alle Jobs (neueste zuerst, aus `fixtures/jobs/`) |
| `GET /v1/pipeline/jobs/{id}` | Job-Status |
| `GET /v1/pipeline/jobs/{id}/acts` | Sprechertexte + Splat/World-Prompts pro Act |
| `GET /v1/pipeline/personas/{id}/acts` | Gleiches für eine Persona (ohne Job) |
| `GET /v1/pipeline/jobs/{id}/events` | SSE-Fortschritt |
| `POST /v1/pipeline/jobs/{id}/sync-worlds` | Welten erneut von image-blaster syncen |

Env: `backend/.env` — `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY` (Szenen-Vorschau), `IMAGE_BLASTER_ROOT` (nur Marble), optional `WORLD_LABS_API_KEY`, `GEMINI_IMAGE_MODEL`.

```bash
# Automatisierte API-Tests (ohne Anthropic, ~1 Min)
npm run test:pipeline

# Live-Smoke gegen laufendes Backend (braucht ANTHROPIC_API_KEY)
npm run test:pipeline:live
```

Siehe `knowledge/persona-reality-studio.md`.

## AUDION-v2 integration

The same module exists in AUDION-v2 for production deploy. **TIK `backend/` is the open-source source of truth**; sync changes into `AUDION-v2/apps/api/app/persona_reality/` when shipping to Coolify.
