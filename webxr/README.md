# Persona Reality — WebXR Pilot

Act 2 (Küche) + Act 3 (Office) WebXR prototype. See `../knowledge/persona-reality-webxr-pilot.md`.

## Quick start

```bash
cd TIK/webxr
npm install
npm run dev              # https://localhost:5173 — splats from ../image-blaster in dev
```

## Studio (`/admin`)

Persona-Reality-Sessions aus Zielgruppe + Company erzeugen (Claude + Node compile).

```bash
# Terminal 1 — API
cd ../backend && source .venv/bin/activate
export PYTHONPATH=. && uvicorn app.main:app --reload --port 8000

# Terminal 2 — WebXR + Studio
VITE_STUDIO_API_BASE=/api npm run dev

# https://localhost:5173/admin
```

Preview einer fertigen Session: `/?config=/scene_configs/<persona_id>_de.json`

Anker bearbeiten (image-blaster, anderer Port): `https://localhost:5174/<world_slug>/anchors`

Doku: `../knowledge/persona-reality-studio.md`

Optional — iPad companion mock (WebSocket):

```bash
npm run companion:mock   # ws://localhost:8765 → pushes golden scene_config
```

## Quest test (echtes VR mit Kopf-Tracking)

1. `npm run dev` → **https://** Network-URL (selbstsigniert)
2. Quest Browser → `https://<LAN-IP>:5173` (**nicht** http)
3. Zertifikat-Warnung → Advanced → Proceed
4. **„In VR starten“** (großer Overlay-Button) — erst dann immersive Session
5. Trigger auf Kugel/Handy/Monitor · **FPS log** in HUD

Ohne Schritt 4: nur 2D-Browser-Fenster (Vorschau mit Maus/Scroll).

## Offline / Production

```bash
SPLAT_TIER=100k npm run sync:world   # leichter für Quest
npm run build && npm run preview
```

### Qualität (`.env` in `webxr/`)

| Variable | Default | Bedeutung |
|----------|---------|-----------|
| `VITE_SPLAT_TIER` | `500k` | SPZ-Detail (`150k` / `500k` / `full_res`) |
| `VITE_VR_FRAMEBUFFER_SCALE` | `1.5` | Quest Render-Auflösung (1.0–2.0) |

Dev lädt SPZ direkt aus `../image-blaster/worlds/` — nach `.env`-Änderung Dev-Server neu starten.

## Acts

| Act | Welt (image-blaster) | Interaktion |
|-----|----------------------|-------------|
| 2 Küche | `tik-kitchen-pilot` | Handy → echeon Feed |
| 3 Office | `modern-office-360` | Monitor → CHECKION Dashboard |

HUD: **Act 2** / **Act 3** zum Wechseln.

## Features

| Feature | Beschreibung |
|---------|----------------|
| scene_config | Golden fixture + WebSocket reload |
| Spark splat | World Labs SPZ pro Welt |
| Scene props | GLBs aus `scene.json` (nur Küche; Office = Splat only) |
| CHECKION | Dashboard-Overlay Act 3 |
| Precache | Beide Welten + Cache API |

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run sync:config` | Golden scene_config → `public/` |
| `npm run sync:world` | SPZ + scene.json + manifest |
| `npm run companion:mock` | WebSocket iPad stub |
| `npm run test` | Schema + anchor tests |

Env: `IMAGE_BLASTER_ROOT`, `SPLAT_TIER`, `VITE_COMPANION_WS_URL`, `VITE_MAX_SCENE_PROPS`

Messprotokoll: `../knowledge/webxr-pilot-results.md`
