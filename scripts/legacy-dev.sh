#!/usr/bin/env bash
# Staršia verzia PRED v2 refaktorom (Magic Mirror, plný RightPanel)
# Commit: 8bce4acf — posledný stav pred merge refactor/pdf-first-v2
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LEGACY="${ROOT}-legacy"
COMMIT="8bce4acf03498d0660f02e17bde6704bbb0bd3cb"
PORT="${LEGACY_DEV_PORT:-5174}"

cd "$ROOT"

if [[ ! -d "$LEGACY" ]]; then
  echo "Vytváram worktree: $LEGACY @ $COMMIT"
  git worktree add "$LEGACY" "$COMMIT"
else
  echo "Worktree už existuje: $LEGACY"
  (cd "$LEGACY" && git checkout "$COMMIT" 2>/dev/null || true)
fi

cd "$LEGACY"
echo "Commit: $(git log -1 --oneline)"

# Stiahni skutočné DejaVu TTF (public/fonts boli poškodené HTML súbory)
if [[ -f "$ROOT/legacy-patches/download-fonts.mjs" ]]; then
  node "$ROOT/legacy-patches/download-fonts.mjs" "$LEGACY"
fi

# Oprava base64-js ESM (linebreak / unicode-properties / react-pdf)
mkdir -p src/shims
cp "$ROOT/legacy-patches/base64-js.ts" src/shims/base64-js.ts
python3 - "$LEGACY/vite.config.ts" <<'PY'
import pathlib, re, sys
path = pathlib.Path(sys.argv[1])
text = path.read_text()
if "src/shims/base64-js.ts" in text:
    sys.exit(0)
text = re.sub(
    r"optimizeDeps:\s*\{\s*exclude:\s*\['@react-pdf/renderer'\],\s*\}",
    """optimizeDeps: {
    include: [
      '@react-pdf/renderer',
      'base64-js',
      'base64-js-cjs',
      'linebreak',
      'unicode-properties',
    ],
    needsInterop: ['base64-js'],
  }""",
    text,
    count=1,
)
if "base64-js-cjs" not in text:
    text = text.replace(
        "'@': path.resolve(__dirname, './src'),",
        "'@': path.resolve(__dirname, './src'),\n      'base64-js': path.resolve(__dirname, './src/shims/base64-js.ts'),\n      'base64-js-cjs': path.resolve(__dirname, './node_modules/base64-js/index.js'),",
        1,
    )
path.write_text(text)
print("Applied base64-js vite patch")
PY

python3 - "$LEGACY/src/components/RightPanel.tsx" "$ROOT/legacy-patches/font-register-snippet.txt" <<'PY'
import pathlib, sys
panel = pathlib.Path(sys.argv[1])
snippet = pathlib.Path(sys.argv[2]).read_text()
text = panel.read_text()
if "// Aliasy používané v štýloch" in text:
    sys.exit(0)
marker = "// ============================================\n// 2. STYLES"
if marker not in text:
    print("RightPanel marker not found — skip font patch")
    sys.exit(0)
text = text.replace(marker, snippet + "\n" + marker, 1)
panel.write_text(text)
print("Applied Cousine/Inter font registration patch")
PY

if [[ ! -d node_modules ]]; then
  echo "npm install..."
  npm install
fi

# Nové okno Cursor s legacy projektom
if command -v cursor &>/dev/null; then
  cursor -n "$LEGACY" 2>/dev/null || cursor "$LEGACY" 2>/dev/null || true
elif command -v code &>/dev/null; then
  code -n "$LEGACY" 2>/dev/null || true
fi

echo ""
echo "Spúšťam dev server (stará verzia) → http://localhost:${PORT}/"
(sleep 2 && open "http://127.0.0.1:${PORT}/") &

rm -rf node_modules/.vite 2>/dev/null || true

echo "Ukončiť: Ctrl+C"
exec npm run dev -- --host 127.0.0.1 --port "$PORT"