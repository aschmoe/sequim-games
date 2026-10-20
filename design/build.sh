#!/usr/bin/env sh
# Builds the mockup board: design/dist/board.html
set -eu
cd "$(dirname "$0")"
mkdir -p dist
{ cat head.html body.html; echo '<script>'; cat art.js scenes.js main.js; echo '</script>'; } > dist/board.html
echo "built design/dist/board.html"
