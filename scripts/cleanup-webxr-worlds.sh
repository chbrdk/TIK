#!/usr/bin/env bash
# Mirror image-blaster cleanup for synced splats under webxr/public/worlds.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORLDS="$ROOT/webxr/public/worlds"

KEEP=(
  void-mirror-identity
  schott-kitchen-morning
  schott-munich-office-day
  schott-homeoffice-evening
  void-constellation-closure
  void-constellation
)

should_keep() {
  local slug="$1"
  for k in "${KEEP[@]}"; do
    if [ "$slug" = "$k" ]; then return 0; fi
  done
  return 1
}

[ -d "$WORLDS" ] || { echo "No webxr/public/worlds"; exit 0; }

for d in "$WORLDS"/*; do
  [ -d "$d" ] || continue
  slug="$(basename "$d")"
  if should_keep "$slug"; then
    echo "keep  $slug"
  else
    rm -rf "$d"
    echo "drop  $slug"
  fi
done

echo "Done."
