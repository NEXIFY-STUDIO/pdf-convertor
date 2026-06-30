#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
ROOT="$(pwd)"
LEGACY="${ROOT}-legacy"

echo "Opravujem fonty v legacy worktree..."
node "$ROOT/legacy-patches/download-fonts.mjs" "$LEGACY"

echo ""
echo "Kontrola DejaVuSans.ttf:"
head -c 4 "$LEGACY/public/fonts/DejaVuSans.ttf" | xxd
echo "(očakávané: 00000000: 0001 0000)"
echo ""
read -r -p "Stlač Enter pre zatvorenie..."