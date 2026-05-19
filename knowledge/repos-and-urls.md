# Persona Reality — Repositories & URLs (Single Source of Truth)

**Regel:** Keine Produkt-URLs in Anwendungscode hardcoden. Diese Datei + Umgebungsvariablen sind die Referenz.

Stand: Mai 2026

---

## Monorepo (canonical)

| Pfad | Inhalt |
|------|--------|
| https://github.com/chbrdk/TIK | Specs + `backend/` + `webxr/` + fixtures |
| `fixtures/golden/` | Golden `scene_config.json` |
| `backend/` | FastAPI `/v1` (OSS, standalone) |
| `webxr/` | **Quest 3 WebXR client** (booth runtime) |
| `knowledge/` | image-blaster, WebXR ops |

---

## Related MSQ DX repos

| Repo | Rolle |
|------|--------|
| **image-blaster** | Gaussian splat worlds + anchor authoring (`../image-blaster`) |
| AUDION-v2 | Production API host (sync `backend/app/persona_reality` from TIK) |
| CHECKION | GEO/Ranking/Domain Metriken |
| PLEXON | Identity, Registry, Usage |
| msqdx-design-system | UI (Companion PWA) |

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
| WebXR dev | `http://localhost:5173` | 5173 |
| image-blaster viewer | `http://localhost:5173` | 5173 (separate app) |
| CHECKION | `http://localhost:3000` | 3000 |
| PLEXON | `http://localhost:3334` | 3334 |

```bash
# TIK monorepo
npm test
cd backend && uvicorn app.main:app --reload --port 8000
cd webxr && npm run dev
```

---

## Gaussian splatting (WebXR)

| Ressource | URL / Pfad |
|-----------|------------|
| **image-blaster** | `../image-blaster` · Setup: `knowledge/image-blaster-setup.md` · [GitHub](https://github.com/neilsonnn/image-blaster) |
| WebXR sync script | `webxr/scripts/sync-world-from-blaster.sh` |
| WebXR runtime guide | `knowledge/persona-reality-webxr-pilot.md` |
| World Labs export docs | https://docs.worldlabs.ai/marble/export/gaussian-splat |
| Meta Immersive Web SDK | https://iwsdk.dev/ |

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
