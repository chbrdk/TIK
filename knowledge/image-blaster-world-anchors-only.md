# image-blaster — World + Anchors only (ohne 3D-Meshes)

Stand: Mai 2026 · Ziel: **WebXR / Persona Reality** — nur Splat-Welt + Anker-Koordinaten in JSON.

## Modus

| Vollständiger IMAGE-BLAST | **world_and_anchors_only** |
|---------------------------|----------------------------|
| World + Plate + 3D pro Objekt + SFX | World + `anchors.json` |
| `output/<object>/*.glb` | Keine Objekt-GLBs |

Skill (image-blaster Repo): `.claude/skills/image-blast-world-anchors/SKILL.md`

## Pfade

| Was | Pfad |
|-----|------|
| image-blaster Welt | `../image-blaster/worlds/<slug>/` |
| Anker-Registry | `worlds/<slug>/anchors.json` |
| WebXR-Manifest | `worlds/<slug>/manifest.json` |
| Default-Positionen (Küche) | `TIK/fixtures/world-anchors-defaults/kitchen_dach.json` |

## Ablauf (Beispiel Schott Act 2)

```bash
cd image-blaster
node .claude/scripts/world-anchors/init-anchors.mjs --world schott-act2-kitchen \
  --from-act-blueprint ../TIK/fixtures/act-blueprints/schott_glasbau_ingenieur/act-02.json \
  --environment-id env_kitchen_lived_in_dach_v1 \
  --apply-default-positions ../TIK/fixtures/world-anchors-defaults/kitchen_dach.json

node .claude/scripts/world-anchors/write-world-manifest.mjs --world schott-act2-kitchen

cd ../TIK
WORLD_SLUG=schott-act2-kitchen SPLAT_TIER=150k ./webxr/scripts/sync-world-from-blaster.sh
cd webxr && npm run dev
```

Anker feinjustieren: image-blaster `bun run dev` → `/<slug>/anchors` → klicken → Speichern → erneut sync.

## WebXR

`manifest.json` enthält `anchors[]` — überschreibt Positionen aus `webxr/src/config/environments.ts`.
