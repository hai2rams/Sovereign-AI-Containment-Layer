#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> npm test"
npm test

echo "==> npm run build"
npm run build

echo "==> npm run lint"
npm run lint

echo "==> npm run demo:all"
npm run demo:all

if [[ ! -d .venv ]]; then
  python3 -m venv .venv
  .venv/bin/pip install -q -r dashboard/requirements.txt
fi

echo "==> pytest tests/dashboard"
.venv/bin/python -m pytest tests/dashboard -q

echo "==> CI validation complete"
