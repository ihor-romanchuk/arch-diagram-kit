#!/usr/bin/env bash
# Render every .mmd file in a folder to SVG (and optionally PNG), and fail if any diagram has an error.
#
# Usage:
#   scripts/render.sh [folder] [--png]
#   scripts/render.sh                                   # docs/architecture/diagrams, SVG only
#   scripts/render.sh --png                             # default folder, SVG + PNG
#   scripts/render.sh examples/brewbox/diagrams --png
#
# Output goes to <folder>/_rendered/. Needs Node.js 18+; uses the Mermaid CLI through npx
# (or a global `mmdc` if one is installed). Exports are build output: do not edit them.

set -uo pipefail

DIR="docs/architecture/diagrams"
PNG=0
for arg in "$@"; do
  case "$arg" in
    --png) PNG=1 ;;
    -h|--help) sed -n '2,11p' "$0"; exit 0 ;;
    -*) echo "Unknown option: $arg" >&2; exit 2 ;;
    *) DIR="$arg" ;;
  esac
done

if [ ! -d "$DIR" ]; then
  echo "Folder not found: $DIR" >&2
  exit 2
fi

MMDC="mmdc"
command -v mmdc >/dev/null 2>&1 || MMDC="npx -y @mermaid-js/mermaid-cli@11"

OUT="$DIR/_rendered"
mkdir -p "$OUT"
fail=0
count=0
shopt -s nullglob
for f in "$DIR"/*.mmd; do
  name="$(basename "$f" .mmd)"
  count=$((count + 1))
  if ! $MMDC -q -i "$f" -o "$OUT/$name.svg" -b white >/dev/null 2>"$OUT/$name.err"; then
    echo "ERROR $name (see $OUT/$name.err)"
    fail=1
    continue
  fi
  if [ "$PNG" -eq 1 ] && ! $MMDC -q -i "$f" -o "$OUT/$name.png" -b white -s 2 >/dev/null 2>"$OUT/$name.err"; then
    echo "ERROR $name PNG export (see $OUT/$name.err)"
    fail=1
    continue
  fi
  rm -f "$OUT/$name.err"
  echo "ok    $name"
done

if [ "$count" -eq 0 ]; then
  echo "No .mmd files in $DIR" >&2
  exit 1
fi
echo "$count diagram(s) checked."
exit $fail
