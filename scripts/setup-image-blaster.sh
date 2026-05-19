#!/usr/bin/env bash
# Clone image-blaster (sibling of TIK), install Bun deps, and seed test input.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BLASTER="${IMAGE_BLASTER_ROOT:-$(dirname "$ROOT")/image-blaster}"

echo "TIK root:      $ROOT"
echo "image-blaster: $BLASTER"

if [ ! -d "$BLASTER/.git" ]; then
  echo "Cloning image-blaster..."
  git clone --depth 1 https://github.com/neilsonnn/image-blaster.git "$BLASTER"
fi

if ! command -v bun >/dev/null 2>&1; then
  echo "Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
fi

export PATH="${HOME}/bun/bin:${PATH}"
cd "$BLASTER"
bun install

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created $BLASTER/.env — add WORLD_LABS_API_KEY and FAL_KEY before generating."
fi

echo ""
echo "Setup complete."
echo "  1. Edit API keys: $BLASTER/.env"
echo "  2. Open folder in Cursor: $BLASTER"
echo "  3. Run: $ROOT/scripts/image-blaster-check.sh"
echo "  4. See: $ROOT/knowledge/image-blaster-setup.md"
