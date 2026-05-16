# Persona Reality — Repositories & URLs (Single Source of Truth)

**Regel:** Keine Produkt-URLs in Anwendungscode hardcoden. Diese Datei + Umgebungsvariablen sind die Referenz.

Stand: Juni 2026

---

## Git Repositories

| Repo | GitHub | Zweck |
|------|--------|-------|
| TIK (Specs) | https://github.com/chbrdk/TIK | OpenAPI, Schema, Rules, Knowledge |
| persona-reality-unity | *TBD — anlegen* | Unity 6 Quest 3 Client |
| persona-reality-companion | *TBD — anlegen* | iPad Booth App |
| AUDION-v2 | *intern* | `/v1` Session Composer (Modul) |
| CHECKION | *intern* | GEO/Ranking/Domain Metriken |
| PLEXON | *intern* | Identity, Registry, Usage |
| msqdx-design-system | https://github.com/msqdx/msqdx-design-system | UI Tokens + React |

---

## Runtime URLs (Production — Zielbild)

| Service | URL | Env-Variable |
|---------|-----|--------------|
| AUDION Persona Reality API | `https://api.audion.msqdx.de/v1` | `AUDION_PERSONA_REALITY_URL` |
| AUDION Staging | `https://audion-staging.msqdx.de/v1` | `AUDION_PERSONA_REALITY_STAGING_URL` |
| CHECKION API | `https://checkion.msqdx.de` | `CHECKION_API_BASE_URL` |
| PLEXON | `https://plexon.msqdx.de` | `NEXT_PUBLIC_PLEXON_URL` |
| Take-home Report | `https://msqdx.de/pr/r/{report_id}` | — |
| Storyblok CDN (textures) | `https://cdn.msqdx.de/...` | per `brand_layer` / storyblok keys |
| echeon API | *TBD* | `ECHEON_API_BASE_URL` |

---

## Local Development

| Service | URL | Port |
|---------|-----|------|
| AUDION /v1 (local) | `http://localhost:8000/v1` | 8000 |
| CHECKION (local) | `http://localhost:3000` | 3000 |
| PLEXON (local) | `http://localhost:3334` | 3334 |
| iPad Companion (local) | `http://localhost:3100` | 3100 |
| Quest WebSocket (booth LAN) | `ws://192.168.x.x:8765/session` | 8765 |

---

## OpenAPI & Schema Paths (TIK Repo)

| Artefakt | Pfad |
|----------|------|
| OpenAPI | `audion-persona-to-scene.openapi.yaml` |
| JSON Schema | `scene_config.v1.schema.json` |
| Golden fixture | `fixtures/golden/klaus_dortmund_de.json` |
| Unity skeleton doc | `unity-project-skeleton.md` |

---

## PLEXON Federation

| Konstante | Wert |
|-----------|------|
| Contract version | `2026-05-plexon-federation-v3` (Code in PLEXON; Docs ggf. v2) |
| Service header | `X-Service-Secret` |
| Usage event type | `persona_reality.session_composed` |

Siehe `knowledge/plexon-integration.md`.

---

## Asset ID Conventions (keine URLs)

- Persona: `klaus_dortmund`
- Environment: `env_kitchen_lived_in_dach_v1`
- Voiceover: `nova_de_act2_03`
- Addressables key = `environment_id` unless overridden in EnvironmentSO
