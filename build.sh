#!/usr/bin/env bash
set -euo pipefail

HUGO_VERSION="0.167.0"
BUILD_DIR="$(mktemp -d)"
TOOLS_DIR="${HOME}/.local/hugo"
trap 'rm -rf "${BUILD_DIR}"' EXIT

mkdir -p "${TOOLS_DIR}"
curl -fsSL --output "${BUILD_DIR}/hugo.tar.gz" \
  "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz"
tar -xzf "${BUILD_DIR}/hugo.tar.gz" -C "${TOOLS_DIR}" hugo

export HUGO_CACHEDIR="${PWD}/.vercel/cache/hugo"
"${TOOLS_DIR}/hugo" version
"${TOOLS_DIR}/hugo" --gc --minify --destination public
