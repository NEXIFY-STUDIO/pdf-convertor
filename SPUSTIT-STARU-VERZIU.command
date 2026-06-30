#!/bin/bash
# Dvojklik v Finderi = nové Terminal okno so starou verziou (pred v2)
cd "$(dirname "$0")"
chmod +x scripts/legacy-dev.sh
exec ./scripts/legacy-dev.sh