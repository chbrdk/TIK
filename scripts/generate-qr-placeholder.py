#!/usr/bin/env python3
"""Pre-generate QR placeholder texture (optional; Unity editor can recreate)."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "unity/Assets/_Project/Art/Visual/qr_placeholder.png"
SIZE = 32

# MSQDX-ish colors
DARK = (15, 15, 15, 255)
YELLOW = (254, 241, 77, 255)

try:
    from PIL import Image
except ImportError:
    # Minimal PNG writer without Pillow — 32x32 is tiny; skip if no PIL
    print("Pillow not installed — skipping qr_placeholder.png (Unity will create on bootstrap).")
    raise SystemExit(0)

img = Image.new("RGBA", (SIZE, SIZE), DARK)
px = img.load()
for y in range(SIZE):
    for x in range(SIZE):
        if ((x // 4) + (y // 4)) % 2 == 0:
            px[x, y] = DARK
        else:
            px[x, y] = YELLOW

OUT.parent.mkdir(parents=True, exist_ok=True)
img.save(OUT)
print(f"Wrote {OUT}")
