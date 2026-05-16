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

## AUDION-v2 integration

The same module exists in AUDION-v2 for production deploy. **TIK `backend/` is the open-source source of truth**; sync changes into `AUDION-v2/apps/api/app/persona_reality/` when shipping to Coolify.
