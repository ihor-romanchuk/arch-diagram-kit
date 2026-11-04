#!/usr/bin/env bash
# Render every .mmd file in a folder to SVG (and optionally PNG), and fail if any diagram has an error.
#
# Usage:
#   scripts/render.sh [folder] [--png]
#   scripts/render.sh docs/architecture/diagrams
#   scripts/render.sh examples/brewbox/diagrams --png
#
# Output goes to <folder>/_rendered/. Needs Node.js 18+; uses the Mermaid CLI through npx
# (or a global `mmdc` if one is installed). Exports are build output: do not edit them.

set -euo pipefail

DIR="${1:-docs/architecture/diagrams}"
PNG="${2:-}"
OUT="$DIR/_rendered"
MMDC="mmdc"
command -v mmdc >/dev/null 2>&1 || MMDC="npx -y @mermaid-js/mermaid-cli@11"

mkdir -p "$OUT"
fail=0
count=0
for f in "$DIR"/*.mmd; do
  [ -e "$f" ] || { echo "No .mmd files in $DIR"; exit 1; }
  name="$(basename "$f" .mmd)"
  count=$((count + 1))
  if $MMDC -q -i "$f" -o "$OUT/$name.svg" -b white >/dev/null 2>"$OUT/$name.err"; then
    rm -f "$OUT/$name.err"
    [ "$PNG" = "--png" ] && $MMDC -q -i "$f" -o "$OUT/$name.png" -b white -s 2 >/dev/null 2>&1
    echo "ok    $name"
  else
    echo "ERROR $name (see $OUT/$name.err)"
    fail=1
  fi
done

echo "$count diagram(s) checked."
exit $fail
