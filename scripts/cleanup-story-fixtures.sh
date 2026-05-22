#!/usr/bin/env bash
# Keep only canonical personas; remove duplicate pipeline / API test stories.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

KEEP_REGEX='^(klaus_dortmund|schott_glasbau_ingenieur_v8)$'
KEEP_GOLDEN_REGEX='^(klaus_dortmund|schott_glasbau_ingenieur_v8)_de\.json$'

remove_persona_files() {
  local dir="$1"
  local ext="${2:-json}"
  [ -d "$dir" ] || return 0
  for f in "$dir"/*."$ext"; do
    [ -f "$f" ] || continue
    base="$(basename "$f" ".$ext")"
    if [[ ! "$base" =~ $KEEP_REGEX ]]; then
      rm -f "$f"
      echo "  - $f"
    fi
  done
}

remove_persona_dirs() {
  local dir="$1"
  [ -d "$dir" ] || return 0
  for d in "$dir"/*; do
    [ -d "$d" ] || continue
    base="$(basename "$d")"
    if [[ ! "$base" =~ $KEEP_REGEX ]] && [[ "$base" != "_test" ]] && [[ "$base" != "_test_arc" ]] && [[ "$base" != "_test_persona" ]]; then
      rm -rf "$d"
      echo "  - $d/"
    fi
  done
}

echo "== persona-profiles"
remove_persona_files fixtures/persona-profiles

echo "== persona-inputs (all ephemeral)"
if [ -d fixtures/persona-inputs ]; then
  rm -f fixtures/persona-inputs/*.json
  echo "  cleared fixtures/persona-inputs/"
fi

echo "== fixtures/personas"
remove_persona_files fixtures/personas

echo "== act-blueprints"
remove_persona_dirs fixtures/act-blueprints
for extra in fixtures/act-blueprints/_test fixtures/act-blueprints/_test_arc fixtures/act-blueprints/_test_persona; do
  [ -d "$extra" ] && rm -rf "$extra" && echo "  - $extra/"
done

echo "== fixtures/generated"
remove_persona_dirs fixtures/generated

echo "== fixtures/golden"
if [ -d fixtures/golden ]; then
  for f in fixtures/golden/*_de.json; do
    [ -f "$f" ] || continue
    base="$(basename "$f")"
    if [[ ! "$base" =~ $KEEP_GOLDEN_REGEX ]]; then
      rm -f "$f"
      echo "  - $f"
    fi
  done
fi

echo "== fixtures/narrative"
if [ -d fixtures/narrative ]; then
  for f in fixtures/narrative/*_de.json; do
    [ -f "$f" ] || continue
    base="$(basename "$f")"
    if [[ ! "$base" =~ $KEEP_GOLDEN_REGEX ]]; then
      rm -f "$f"
      echo "  - $f"
    fi
  done
fi

echo "== fixtures/jobs"
if [ -d fixtures/jobs ]; then
  rm -rf fixtures/jobs/*
  echo "  cleared fixtures/jobs/"
fi

echo "== webxr/public/scene_configs"
if [ -d webxr/public/scene_configs ]; then
  for f in webxr/public/scene_configs/*_de.json; do
    [ -f "$f" ] || continue
    base="$(basename "$f")"
    if [[ ! "$base" =~ $KEEP_GOLDEN_REGEX ]]; then
      rm -f "$f"
      echo "  - $f"
    fi
  done
fi

echo "== webxr/public/narrative"
if [ -d webxr/public/narrative ]; then
  for f in webxr/public/narrative/*_de.json; do
    [ -f "$f" ] || continue
    base="$(basename "$f")"
    if [[ ! "$base" =~ $KEEP_GOLDEN_REGEX ]]; then
      rm -f "$f"
      echo "  - $f"
    fi
  done
fi

echo "== webxr/public/narrative-previews"
remove_persona_dirs webxr/public/narrative-previews

echo "Done. Kept: klaus_dortmund, schott_glasbau_ingenieur_v8"
