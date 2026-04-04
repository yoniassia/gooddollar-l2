#!/bin/bash
# Generate daily GoodUpdate.md with live data
# Called by DevOps agent or cron

set -e
cd "$(dirname "$0")/.."

TODAY=$(date -u +%Y-%m-%d)
OUTPUT="docs/GoodUpdate.md"

# Gather data
ROOT_V=$(node -p "require('./package.json').version" 2>/dev/null || echo "?")
FRONTEND_V=$(node -p "require('./frontend/package.json').version" 2>/dev/null || echo "?")
SDK_V=$(node -p "require('./sdk/package.json').version" 2>/dev/null || echo "?")

COMMITS_24H=$(git log --oneline --since="24 hours ago" | wc -l)
TOTAL_CONTRACTS=$(find src -name "*.sol" 2>/dev/null | wc -l)
TOTAL_PAGES=$(find frontend/src/app -name "page.tsx" 2>/dev/null | wc -l)
TOTAL_TEST_SOL=$(find test -name "*.t.sol" 2>/dev/null | wc -l)

STATS=$(curl -s https://explorer.goodclaw.org/api/v2/stats 2>/dev/null || echo '{}')
BLOCKS=$(echo "$STATS" | python3 -c "import json,sys; print(json.load(sys.stdin).get('total_blocks','?'))" 2>/dev/null || echo "?")
TXS=$(echo "$STATS" | python3 -c "import json,sys; print(json.load(sys.stdin).get('total_transactions','?'))" 2>/dev/null || echo "?")
ADDRS=$(echo "$STATS" | python3 -c "import json,sys; print(json.load(sys.stdin).get('total_addresses','?'))" 2>/dev/null || echo "?")

# Recent commits summary
RECENT_COMMITS=$(git log --oneline --since="24 hours ago" | head -20)

echo "Generated GoodUpdate for $TODAY: v$ROOT_V, $COMMITS_24H commits, $BLOCKS blocks"
echo "Output: $OUTPUT"
echo "Edit $OUTPUT manually or let the DevOps agent fill in agent activity details."
