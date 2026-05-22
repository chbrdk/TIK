# image-blaster — Setup & Test (Persona Reality / TIK)

Stand: Mai 2026 · Repo: [neilsonnn/image-blaster](https://github.com/neilsonnn/image-blaster)

## Pfade (nicht hardcoden im Code)

| Was | Pfad |
|-----|------|
| image-blaster Clone | `../image-blaster` (neben `TIK/`) |
| Override | Env `IMAGE_BLASTER_ROOT` |
| Generierte Welten | `image-blaster/worlds/<slug>/` |
| Anker-Registry | `worlds/<slug>/anchors.json` |
| WebXR-Sync-Ziel | `TIK/webxr/public/worlds/<slug>/` |

## Einmal-Setup

```bash
cd /Users/m4-dev/Desktop/GITHUB/TIK
chmod +x scripts/setup-image-blaster.sh scripts/image-blaster-*.sh
./scripts/setup-image-blaster.sh
```

API-Keys in `../image-blaster/.env`:

| Variable | Zweck |
|----------|--------|
| `WORLD_LABS_API_KEY` | Marble 1.1 Environment (.spz) |
| `FAL_KEY` | Image-Edit (optional; 3D meshes **nicht** für Persona Reality) |

```bash
./scripts/image-blaster-check.sh
```

## Persona Reality: World + Anker only

Für Messe/WebXR **kein** voller IMAGE-BLAST mit 3D-Objekten. Skill: `image-blast-world-anchors` in image-blaster.

```bash
# World
node .claude/scripts/world/generate-world.mjs --world <slug> --prompt "..." --image worlds/<slug>/source/...

# Anker aus Act-Blueprint
Aufräumen alter Welten (nur `schott_glasbau_ingenieur_v8`-Slugs): `scripts/cleanup-worlds.sh` im image-blaster-Repo; in TIK zusätzlich `scripts/cleanup-webxr-worlds.sh`.

```bash
node .claude/scripts/world-anchors/init-anchors.mjs --world <slug> \
  --from-act-blueprint ../TIK/fixtures/act-blueprints/<persona>/act-02.json \
  --environment-id env_kitchen_lived_in_dach_v1

node .claude/scripts/world-anchors/write-world-manifest.mjs --world <slug>
```

## Viewer (Authoring)

```bash
cd ../image-blaster && bun run dev
# → http://localhost:5173/<slug>
# → http://localhost:5173/<slug>/anchors  (Anker platzieren)
```

## WebXR (Runtime)

```bash
cd TIK
WORLD_SLUG=<slug> SPLAT_TIER=150k ./webxr/scripts/sync-world-from-blaster.sh
cd webxr && npm install && npm run dev
# Quest Browser → https://<LAN>:5173
```

Siehe [persona-reality-webxr-pilot.md](./persona-reality-webxr-pilot.md).

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| `bun: command not found` | `export PATH="$HOME/.bun/bin:$PATH"` |
| Keys fehlen | `.env` in image-blaster, `image-blaster-check.sh` |
| Kein `.spz` | `worlds/<slug>/output/world/` prüfen |
| Anker falsch | image-blaster `/<slug>/anchors` → speichern → erneut sync |
