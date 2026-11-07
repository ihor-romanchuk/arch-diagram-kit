#!/usr/bin/env bash
# Kept for older instructions: the same as `arch-diagrams export`.
# Renders every .mmd file in a folder to <folder>/_rendered/*.svg (and PNG with --png),
# and fails if any diagram has an error.
#
# Usage:
#   scripts/render.sh [folder] [--png]          # default folder: docs/architecture/diagrams
exec node "$(dirname "$0")/../bin/arch-diagrams.mjs" export "$@"
