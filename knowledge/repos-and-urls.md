# Persona Reality — Repositories & URLs (Single Source of Truth)

**Regel:** Keine Produkt-URLs in Anwendungscode hardcoden. Diese Datei + Umgebungsvariablen sind die Referenz.

Stand: Juni 2026

---

## Monorepo (canonical)

| Pfad | Inhalt |
|------|--------|
| https://github.com/chbrdk/TIK | **Ein Repo:** Specs + `backend/` + `unity/` + fixtures |
| `fixtures/golden/` | Golden `scene_config.json` |
| `backend/` | FastAPI `/v1` (OSS, standalone) |
| `unity/` | Unity 6 Quest 3 Client |

---

## Related MSQ DX repos

| Repo | Rolle |
|------|--------|
| AUDION-v2 | Production API host (sync `backend/app/persona_reality` from TIK) |
| CHECKION | GEO/Ranking/Domain Metriken |
| PLEXON | Identity, Registry, Usage |
| msqdx-design-system | UI (Companion PWA, später) |

---

## Runtime URLs (Production — Zielbild)

| Service | URL | Env-Variable |
|---------|-----|--------------|
| Persona Reality API | `https://api.audion.msqdx.de/v1` | `AUDION_PERSONA_REALITY_URL` |
| Staging | `https://audion-staging.msqdx.de/v1` | `AUDION_PERSONA_REALITY_STAGING_URL` |
| CHECKION API | `https://checkion.msqdx.de` | `CHECKION_API_BASE_URL` |
| PLEXON | `https://plexon.msqdx.de` | `NEXT_PUBLIC_PLEXON_URL` |
| Take-home Report | `https://msqdx.de/pr/r/{report_id}` | — |

---

## Local Development

| Service | URL | Port |
|---------|-----|------|
| TIK backend | `http://localhost:8000/v1` | 8000 |
| CHECKION | `http://localhost:3000` | 3000 |
| PLEXON | `http://localhost:3334` | 3334 |

```bash
# TIK monorepo
npm test
cd backend && uvicorn app.main:app --reload --port 8000
```

---

## OpenAPI & Schema (repo root)

| Artefakt | Pfad |
|----------|------|
| OpenAPI | `audion-persona-to-scene.openapi.yaml` |
| JSON Schema | `scene_config.v1.schema.json` |
| Golden fixture | `fixtures/golden/klaus_dortmund_de.json` |

---

## PLEXON Federation

| Konstante | Wert |
|-----------|------|
| Contract version | `2026-05-plexon-federation-v3` |
| Usage event type | `persona_reality.session_composed` |

Siehe `plexon-integration.md`.
