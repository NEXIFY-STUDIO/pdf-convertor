#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
chmod +x scripts/push-github.sh
bash scripts/push-github.sh win11version
echo ""
read -r -p "Hotovo. Stlač Enter..."