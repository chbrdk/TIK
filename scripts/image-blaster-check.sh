#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BLASTER="${IMAGE_BLASTER_ROOT:-$(dirname "$ROOT")/image-blaster}"
TOOLS="$ROOT/scripts/image-blaster-tools"
export PATH="${HOME}/.bun/bin:${PATH}"

ok=0
warn=0

check() {
  local label="$1"
  shift
  if "$@" >/dev/null 2>&1; then
    echo "OK   $label"
    ok=$((ok + 1))
  else
    echo "FAIL $label"
    warn=$((warn + 1))
  fi
}

echo "image-blaster health check"
echo "  blaster: $BLASTER"
echo ""

[ -d "$BLASTER" ] || { echo "FAIL repo missing — run: $ROOT/scripts/setup-image-blaster.sh"; exit 1; }

check "bun installed" command -v bun
check "node installed" command -v node
check "blaster node_modules" test -d "$BLASTER/node_modules"
check "spz-js tools" test -d "$TOOLS/node_modules/spz-js"
check "test image in input/" test -f "$BLASTER/input/klaus-kitchen-reference.jpg"

if [ -f "$BLASTER/.env" ]; then
  if grep -qE '^WORLD_LABS_API_KEY=.+$' "$BLASTER/.env" && ! grep -q 'your_world_labs_key_here' "$BLASTER/.env"; then
    echo "OK   WORLD_LABS_API_KEY set"
    ok=$((ok + 1))
  else
    echo "WARN WORLD_LABS_API_KEY missing or placeholder"
    warn=$((warn + 1))
  fi
  if grep -qE '^FAL_KEY=.+$' "$BLASTER/.env" && ! grep -q 'your_fal_key_here' "$BLASTER/.env"; then
    echo "OK   FAL_KEY set"
    ok=$((ok + 1))
  else
    echo "WARN FAL_KEY missing or placeholder"
    warn=$((warn + 1))
  fi
else
  echo "WARN .env missing — run setup-image-blaster.sh"
  warn=$((warn + 1))
fi

WORLD_COUNT=$(find "$BLASTER/worlds" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')
if [ "$WORLD_COUNT" -gt 0 ]; then
  echo "OK   worlds/ has $WORLD_COUNT project(s)"
else
  echo "INFO no worlds yet — run blast in Cursor (see knowledge/image-blaster-setup.md)"
fi

echo ""
if [ "$warn" -gt 0 ]; then
  echo "Ready for viewer; generation needs API keys in .env"
  exit 0
fi
echo "All checks passed."
