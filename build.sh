#!/usr/bin/env sh
# Concatenates src/ into one self-contained page: dist/index.html
set -eu
cd "$(dirname "$0")"
mkdir -p dist
{
  cat src/page-head.html
  echo '<script>'
  cat src/art.js src/engine.js src/shell.js src/events/volt.js src/events/patch.js src/events/stage.js src/events/dnd.js
  echo 'boot();'
  echo '</script>'
} > dist/index.html
cp static/* dist/
# Syntax check the inlined script when node is available
if command -v node >/dev/null 2>&1; then
  sed -n '/^<script>$/,/^<\/script>$/p' dist/index.html | sed '1d;$d' > dist/.check.js
  node --check dist/.check.js
  rm dist/.check.js
fi
echo "built dist/index.html ($(wc -c < dist/index.html) bytes)"
