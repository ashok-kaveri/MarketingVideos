#!/usr/bin/env bash
# Links capture/ to the MCSL test-automation repo so capture flows reuse its login (session, OTP,
# CAPTCHA pause), its Shopify order uploader and its page objects, with ONE copy of Playwright.
#   capture/node_modules -> <test repo>/node_modules   (same @playwright/test instance as the page objects)
#   capture/.mcsl        -> <test repo>                 (imported as @mcsl/support/...)
# Override the location with MCSL_TEST_REPO=/path/to/mcsl-test-automation bash capture/setup.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
repo="${MCSL_TEST_REPO:-$here/../../../qa_automation/mcsl-test-automation}"
repo="$(cd "$repo" 2>/dev/null && pwd)" || { echo "✗ test repo not found: ${MCSL_TEST_REPO:-../../../qa_automation/mcsl-test-automation}" >&2; exit 1; }
[ -d "$repo/node_modules/@playwright/test" ] || { echo "✗ run 'npm install' in $repo first" >&2; exit 1; }
[ -f "$repo/support/pages/login/loginPage.ts" ] || { echo "✗ $repo does not look like mcsl-test-automation" >&2; exit 1; }
for link in node_modules .mcsl; do
  if [ -e "$here/$link" ] && [ ! -L "$here/$link" ]; then echo "✗ $here/$link exists and is not a symlink; remove it first" >&2; exit 1; fi
done
ln -sfn "$repo/node_modules" "$here/node_modules"
ln -sfn "$repo" "$here/.mcsl"
echo "✓ capture/ linked to $repo"
echo "  Playwright $(node -p "require('$repo/node_modules/@playwright/test/package.json').version")"
