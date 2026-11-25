#!/usr/bin/env bash
# Render preview stills of a carrier video into carriers/<code>/review/stills/ and tile a contact sheet.
# usage: scripts/stills.sh <code> <frame> [frame...]
set -euo pipefail
cd "$(dirname "$0")/.."
code=$1; shift
out=../carriers/$code/review/stills; mkdir -p "$out"
rm -rf build && npx remotion bundle src/index.ts --out-dir=build --log=error
for f in "$@"; do npx remotion still build "carrier-$code" "$out/f$(printf %05d "$f").png" --frame="$f" --log=error; done
ffmpeg -v error -y -pattern_type glob -i "$out/f*.png" -vf "scale=960:-1,tile=2x$(( ($# + 1) / 2 ))" -frames:v 1 "$out/sheet.jpg"
echo "STILLS_DONE $out/sheet.jpg"
