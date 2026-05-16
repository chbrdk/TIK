#!/usr/bin/env bash
# Sync golden scene_config into Unity StreamingAssets (single source: fixtures/golden/)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/fixtures/golden/klaus_dortmund_de.json"
DEST="$ROOT/unity/Assets/_Project/StreamingAssets/scene_configs/dev_klaus_dortmund.json"
mkdir -p "$(dirname "$DEST")"
cp "$SRC" "$DEST"
echo "Synced → $DEST"
