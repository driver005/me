#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="static/images/works"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$PROJECT_ROOT/$OUT_DIR"

declare -A SITES
SITES["teclab"]="https://sfz-tuebingen.org/"
SITES["hhmodle"]="https://github.com/driver005/hhmodle"
SITES["congelado"]="https://github.com/driver005/congelado"
SITES["blog"]="https://blog.a42n.com/"
SITES["me"]="https://github.com/driver005/me"
SITES["fuzzyboard"]="https://github.com/driver005/fuzzyboard"

CHROME_PATH="/home/default/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome"

for name in "${!SITES[@]}"; do
  url="${SITES[$name]}"
  out="$PROJECT_ROOT/$OUT_DIR/${name}-preview.png"
  echo "→ $name ($url)"

  PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="$CHROME_PATH" \
  PLAYWRIGHT_BROWSERS_PATH=/home/default/.cache/ms-playwright \
  node -e "
    const { chromium } = require('playwright');
    (async () => {
      const browser = await chromium.launch({ headless: true, channel: undefined });
      const page = await browser.newPage();
      await page.goto('$url', { waitUntil: 'load', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1500);
      await page.screenshot({ path: '$out', fullPage: true });
      await browser.close();
    })().catch(() => process.exit(1));
  " 2>/dev/null

  if [ -f "$out" ]; then
    echo "  ✓ saved ($(du -h "$out" | cut -f1))"
  else
    echo "  ✗ failed"
  fi
done

echo "Done. Images in $OUT_DIR/"
