#!/usr/bin/env bash

set -euo pipefail

PORT="${1:-4174}"
HOST="${2:-127.0.0.1}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting frontend server..."
echo "Root: ${SCRIPT_DIR}"
echo "URL: http://${HOST}:${PORT}/"
echo "Press Ctrl+C to stop."

cd "${SCRIPT_DIR}"
npm install
exec npm run dev -- --host "${HOST}" --port "${PORT}"
