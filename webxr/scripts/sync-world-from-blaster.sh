#!/usr/bin/env bash
# Copy tik-kitchen-pilot world assets + write manifest for production/offline builds.
set -euo pipefail
WEBXR="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="$(cd "$WEBXR/.." && pwd)"
BLASTER="${IMAGE_BLASTER_ROOT:-$(dirname "$ROOT")/image-blaster}"
SLUG="${WORLD_SLUG:-tik-kitchen-pilot}"
SPLAT_TIER="${SPLAT_TIER:-150k}"
SRC_WORLD="$BLASTER/worlds/$SLUG/output/world"
DEST="$WEBXR/public/worlds/$SLUG"

if [ ! -d "$SRC_WORLD" ]; then
  echo "Missing $SRC_WORLD — run image-blaster world gen first."
  exit 1
fi

mkdir -p "$DEST"
SPZ="$SRC_WORLD/0-world-${SPLAT_TIER}.spz"
if [ ! -f "$SPZ" ]; then
  SPZ=$(ls "$SRC_WORLD"/*-${SPLAT_TIER}.spz 2>/dev/null | head -1)
fi
if [ -z "${SPZ:-}" ] || [ ! -f "$SPZ" ]; then
  echo "No SPZ for tier $SPLAT_TIER in $SRC_WORLD"
  exit 1
fi

cp "$SPZ" "$DEST/splat.spz"
[ -f "$SRC_WORLD/0-world.glb" ] && cp "$SRC_WORLD/0-world.glb" "$DEST/collider.glb"
ANCHORS_SRC="$BLASTER/worlds/$SLUG/anchors.json"
[ -f "$ANCHORS_SRC" ] && cp "$ANCHORS_SRC" "$DEST/anchors.json"
MANIFEST_SRC="$BLASTER/worlds/$SLUG/manifest.json"
SCENE_SRC="$BLASTER/worlds/$SLUG/scene.json"
[ -f "$SCENE_SRC" ] && cp "$SCENE_SRC" "$DEST/scene.json"

# Object GLBs
OBJECT_DIR="$BLASTER/worlds/$SLUG/output"
for dir in "$OBJECT_DIR"/*/; do
  [ -d "$dir" ] || continue
  base=$(basename "$dir")
  case "$base" in world|sfx) continue ;; esac
  glb=$(find "$dir" -maxdepth 1 -name '*.glb' -type f 2>/dev/null | head -1)
  [ -n "$glb" ] && mkdir -p "$DEST/objects/$base" && cp "$glb" "$DEST/objects/$base/model.glb"
done

ENV_ID="env_kitchen_lived_in_dach_v1"
METRIC_SCALE=1
GROUND_OFFSET=0
if [ "$SLUG" = "modern-office-360" ]; then
  ENV_ID="env_home_office_lived_in_dach_v1"
  METRIC_SCALE=1.6493142
  GROUND_OFFSET=1.6121744
fi

if [ -f "$MANIFEST_SRC" ]; then
  cp "$MANIFEST_SRC" "$DEST/manifest.json"
  # Ensure production splat paths match synced filenames
  node -e "
    const fs=require('fs');
    const p='$DEST/manifest.json';
    const m=JSON.parse(fs.readFileSync(p,'utf8'));
    m.splat_url='/worlds/$SLUG/splat.spz';
    m.splat_tier='$SPLAT_TIER';
    if (fs.existsSync('$DEST/collider.glb')) m.collider_url='/worlds/$SLUG/collider.glb';
    m.mode=m.mode||'world_and_anchors_only';
    fs.writeFileSync(p, JSON.stringify(m,null,2)+'\n');
  "
else
  cat > "$DEST/manifest.json" <<EOF
{
  "slug": "$SLUG",
  "environment_id": "$ENV_ID",
  "splat_url": "/worlds/$SLUG/splat.spz",
  "splat_tier": "$SPLAT_TIER",
  "collider_url": "/worlds/$SLUG/collider.glb",
  "semantics": {
    "metric_scale_factor": $METRIC_SCALE,
    "ground_plane_offset": $GROUND_OFFSET,
    "flip_y": true
  }
}
EOF
fi

echo "Synced world → $DEST (splat tier: $SPLAT_TIER)"
