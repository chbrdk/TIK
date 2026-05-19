#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WEBXR="$(cd "$(dirname "$0")/.." && pwd)"
NARRATIVE="$ROOT/fixtures/narrative/klaus_dortmund_de.json"
SCENE_SRC="$ROOT/fixtures/golden/klaus_dortmund_de.json"
DEST_DIR="$WEBXR/public/scene_configs"
NARRATIVE_DEST="$WEBXR/public/narrative"

if [[ -f "$NARRATIVE" ]]; then
  node "$ROOT/scripts/merge-narrative-into-scene-config.mjs" --out "$SCENE_SRC"
fi

mkdir -p "$DEST_DIR" "$NARRATIVE_DEST"
cp "$SCENE_SRC" "$DEST_DIR/klaus_dortmund_de.json"
if [[ -f "$NARRATIVE" ]]; then
  cp "$NARRATIVE" "$NARRATIVE_DEST/klaus_dortmund_de.json"
fi
echo "Synced scene_config → $DEST_DIR/klaus_dortmund_de.json"
echo "Synced narrative_manifest → $NARRATIVE_DEST/klaus_dortmund_de.json"
