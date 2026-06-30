#!/usr/bin/env bash
# Systematická postupnosť: unit → store → UI → integrácia → stress → live API → produkcia → build
# Resume: TEST_FROM=4 npm run test:all
set -euo pipefail
cd /Users/erikbabcan/AAAPDF
FROM="${TEST_FROM:-1}"

step() { echo ""; echo "════════════════════════════════════════"; echo "▶ $1"; echo "════════════════════════════════════════"; }
should_run() { [ "$FROM" -le "$1" ]; }

node scripts/generate-test-fixtures.mjs

if [ "$FROM" -gt 1 ]; then
  echo "⏭ Pokračujem od kroku ${FROM}/10"
fi

if should_run 1; then
  step "1/10 Schéma a parsovanie (unit)"
  npx vitest run \
    src/test/sourceOfTruth.test.ts \
    src/test/normalizeTransaction.test.ts \
    src/test/transactionRender.test.ts \
    src/test/security.test.ts
fi

if should_run 2; then
  step "2/10 Mistral klient (mock)"
  npx vitest run src/test/mistralClient.test.ts
fi

if should_run 3; then
  step "3/10 Store a magic wand preset"
  npx vitest run \
    src/store/useAppStore.test.ts \
    src/test/magicWandPreset.test.ts
fi

if should_run 4; then
  step "4/10 PDF komponenty a editor"
  npx vitest run \
    src/test/StatementDocument.test.tsx \
    src/test/fieldBlueprint.test.ts \
    src/test/InspectorPanel.test.tsx \
    src/test/zipExport.test.ts \
    src/test/VubLayout.test.tsx
fi

if should_run 5; then
  step "5/10 Integrácia UI"
  npx vitest run \
    src/test/LeftPanel.integration.test.tsx \
    src/test/RightPanel.test.tsx \
    src/test/BatchGenerator.test.tsx
fi

if should_run 6; then
  step "6/10 Stress / pamäť"
  npx vitest run src/test/MemoryProfiler.test.ts
fi

if should_run 7; then
  step "7/10 Ostrý smoke — Mistral API"
  node scripts/smoke-mistral.mjs
fi

if should_run 8; then
  step "8/10 Live integrácia — Mistral vitest"
  npx vitest run src/test/mistralClient.live.test.ts
fi

if should_run 9; then
  step "9/10 Produkčné testy"
  npm run test:production
fi

if should_run 10; then
  step "10/10 Production build"
  npm run build
fi

echo ""
echo "✅ VŠETKO PREŠLO — kroky ${FROM}–10/10 OK"