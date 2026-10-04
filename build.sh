#!/usr/bin/env bash
set -euo pipefail

# Package the static site without installing a framework or dependencies.
rm -rf public
mkdir -p public
cp index.html public/index.html
cp -R portfolio public/
touch public/.nojekyll
printf 'Static site ready: public/index.html\n'
