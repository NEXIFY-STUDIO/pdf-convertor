#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

PORT=5173
lsof -ti:"$PORT" | xargs kill -9 2>/dev/null || true
lsof -ti:5174 | xargs kill -9 2>/dev/null || true

echo "Spúšťam dev server → http://127.0.0.1:${PORT}/"
echo "Prednastavené: Kolomanov Mlyn, 3 výpisy 04–06/2026"
echo "Ukončiť: Ctrl+C"
echo ""

(sleep 2 && open "http://127.0.0.1:${PORT}/") &

exec npm run dev -- --host 127.0.0.1 --port "$PORT"