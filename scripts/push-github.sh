#!/usr/bin/env bash
# Commit + push win11version na GitHub (NEXIFY-STUDIO/pdf-convertor)
set -euo pipefail
cd /Users/erikbabcan/AAAPDF

BRANCH="${1:-win11version}"

echo "▶ Generujem test fixtures..."
node scripts/generate-test-fixtures.mjs

echo "▶ Lokálne testy (bez live API)..."
npm run build
npx vitest run src/ --exclude '**/mistralClient.live.test.ts'
npm run test:production

echo "▶ Git commit na vetvu: $BRANCH"
git add -A
git status --short

if git diff --cached --quiet; then
  echo "Nič nové na commit."
else
  git commit -m "$(cat <<'EOF'
feat: Kolomanov Mlyn magic wand, 2-page PDF preset, CI green

- Magic wand preset (IČO 57194050, SLSP, 3× výpis 04–06/2026)
- Kompaktný 2-stranový PDF layout (max 10 platieb)
- Mistral smoke test, test:all pipeline, auto fixtures
- CI: main + win11version, bez live API v unit testoch
EOF
)"
fi

echo "▶ Pull rebase + push..."
git pull --rebase origin "$BRANCH" || true
git push -u origin "$BRANCH"

echo ""
echo "✅ Pushnuté na https://github.com/NEXIFY-STUDIO/pdf-convertor/tree/$BRANCH"
echo "   Sleduj CI: https://github.com/NEXIFY-STUDIO/pdf-convertor/actions"