# Persona Reality — Umgebungen produzieren (WebXR)

Stand: Mai 2026

**Pipeline:** image-blaster (Gaussian splat + Anker) → Sync → WebXR auf Quest 3 Browser.

Siehe [image-blaster-setup.md](./image-blaster-setup.md) · [image-blaster-world-anchors-only.md](./image-blaster-world-anchors-only.md) · [persona-reality-webxr-pilot.md](./persona-reality-webxr-pilot.md)

## Die 5 Umgebungen (scene_config)

| Act | `environment_id` | Anker (Pflicht) |
|-----|------------------|-----------------|
| 1 | `env_void_mirror_v1` | `PersonaPlaceholder` |
| 2 | `env_kitchen_lived_in_dach_v1` | `phone_main`, `wall_calendar`, `kitchen_counter_docs` |
| 3 | `env_home_office_lived_in_dach_v1` | `monitor_left` |
| 4 | `env_home_living_lived_in_dach_v1` | `sofa_main` |
| 5 | `env_void_constellation_v1` | `qr_panel` |

Anker-Namen müssen exakt in `anchors.json` / `scene_config` übereinstimmen.

## Workflow pro Raum (Beispiel Act 2 Küche)

### 1. World generieren (image-blaster)

```bash
cd ../image-blaster
# Skill: image-blast-world-anchors
node .claude/scripts/world/generate-world.mjs --world <slug> ...
node .claude/scripts/world-anchors/init-anchors.mjs --world <slug> \
  --from-act-blueprint ../TIK/fixtures/act-blueprints/<persona>/act-02.json
```

### 2. Anker platzieren

```bash
bun run dev
# http://localhost:5173/<slug>/anchors → Speichern
```

### 3. Nach WebXR syncen

```bash
cd TIK
WORLD_SLUG=<slug> SPLAT_TIER=150k ./webxr/scripts/sync-world-from-blaster.sh
cd webxr && npm run dev
```

### 4. Test Quest 3

Quest Browser → `https://<LAN>:5173` → VR → Act 2 aus Golden- oder Live-`scene_config`.

## Qualität Quest 3

- Splat-Tier **150k** oder **100k** für Booth (nicht `full_res` am Gerät)
- Welt + `scene_config` lokal precachen (`webxr` Cache API)
- 5-Min-Lauf ohne Tab-Kill — siehe Mess-Checkliste in [persona-reality-webxr-pilot.md](./persona-reality-webxr-pilot.md)

## Pfade

| Was | Pfad |
|-----|------|
| image-blaster Welt | `../image-blaster/worlds/<slug>/` |
| WebXR public | `TIK/webxr/public/worlds/<slug>/` |
| Golden session | `TIK/fixtures/golden/klaus_dortmund_de.json` |
| Act blueprints | `TIK/fixtures/act-blueprints/<persona>/` |
