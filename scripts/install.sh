#!/usr/bin/env bash
set -euo pipefail

PACKAGE="@involvex/youtube-music-cli"

# Check for bun first (recommended)
if command -v bun >/dev/null 2>&1; then
  bun install -g "$PACKAGE"
  echo "youtube-music-cli installed via bun. Run: youtube-music-cli"
  exit 0
fi

# Fallback to npm
if command -v npm >/dev/null 2>&1; then
  npm install -g "$PACKAGE"
  echo "youtube-music-cli installed via npm. Run: youtube-music-cli"
  exit 0
fi

echo "Error: bun or node.js is required to install ${PACKAGE}." >&2
echo "Install bun from https://bun.sh or node.js from https://nodejs.org" >&2
exit 1
