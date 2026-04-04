#!/usr/bin/env bash
# GoodDollar L2 — Deployment Health Checker
# Usage: bash scripts/health-check.sh
# Exit: 0 = all healthy, 1 = failures detected

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FAILURES=0
WARNINGS=0

pass() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; ((WARNINGS++)); }
fail() { echo -e "${RED}✗${NC} $1"; ((FAILURES++)); }

echo "═══════════════════════════════════════════"
echo " GoodDollar L2 Health Check"
echo " $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "═══════════════════════════════════════════"
echo ""

# ── 1. Web Services ──────────────────────────────────────────────
echo "── Web Services ──"

check_url() {
  local name="$1" url="$2"
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "$url" 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 400 ]; then
    pass "$name ($url) → HTTP $HTTP_CODE"
  elif [ "$HTTP_CODE" = "000" ]; then
    fail "$name ($url) → Connection failed"
  else
    warn "$name ($url) → HTTP $HTTP_CODE"
  fi
}

check_url "GoodSwap Frontend" "https://goodswap.goodclaw.org"
check_url "Block Explorer" "https://explorer.goodclaw.org"
# RPC needs a POST check, not GET
RPC_RESULT=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"web3_clientVersion","params":[],"id":1}' --connect-timeout 5 2>/dev/null)
if echo "$RPC_RESULT" | grep -q '"result"'; then
  RPC_CLIENT=$(echo "$RPC_RESULT" | grep -o '"result":"[^"]*"' | cut -d'"' -f4)
  pass "RPC Endpoint (localhost:8545) → $RPC_CLIENT"
else
  fail "RPC Endpoint (localhost:8545) → not responding"
fi

echo ""

# ── 2. Chain Health ──────────────────────────────────────────────
echo "── Chain Health ──"

BLOCK_HEX=$(curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  --connect-timeout 5 2>/dev/null | grep -o '"result":"[^"]*"' | cut -d'"' -f4)

if [ -n "$BLOCK_HEX" ]; then
  BLOCK_NUM=$((16#${BLOCK_HEX#0x}))
  pass "Chain responding — block #$BLOCK_NUM"
  
  # Check block is recent (within last 60 seconds)
  BLOCK_TS_HEX=$(curl -s -X POST http://localhost:8545 \
    -H "Content-Type: application/json" \
    -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBlockByNumber\",\"params\":[\"$BLOCK_HEX\",false],\"id\":1}" \
    --connect-timeout 5 2>/dev/null | grep -o '"timestamp":"[^"]*"' | cut -d'"' -f4)
  
  if [ -n "$BLOCK_TS_HEX" ]; then
    BLOCK_TS=$((16#${BLOCK_TS_HEX#0x}))
    NOW_TS=$(date +%s)
    DIFF=$((NOW_TS - BLOCK_TS))
    if [ "$DIFF" -lt 120 ]; then
      pass "Chain producing blocks (last block ${DIFF}s ago)"
    else
      warn "Chain may be stalled (last block ${DIFF}s ago)"
    fi
  fi
else
  fail "Chain not responding on localhost:8545"
fi

CHAIN_ID_HEX=$(curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  --connect-timeout 5 2>/dev/null | grep -o '"result":"[^"]*"' | cut -d'"' -f4)

if [ -n "$CHAIN_ID_HEX" ]; then
  CHAIN_ID=$((16#${CHAIN_ID_HEX#0x}))
  if [ "$CHAIN_ID" -eq 42069 ]; then
    pass "Chain ID: $CHAIN_ID (correct)"
  else
    warn "Chain ID: $CHAIN_ID (expected 42069)"
  fi
fi

echo ""

# ── 3. PM2 Processes ────────────────────────────────────────────
echo "── PM2 Processes ──"

if command -v pm2 &>/dev/null; then
  PM2_JSON=$(pm2 jlist 2>/dev/null || echo "[]")
  TOTAL=$(echo "$PM2_JSON" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
  ONLINE=$(echo "$PM2_JSON" | python3 -c "import sys,json; print(sum(1 for p in json.load(sys.stdin) if p.get('pm2_env',{}).get('status')=='online'))" 2>/dev/null || echo "0")
  ERRORED=$(echo "$PM2_JSON" | python3 -c "import sys,json; print(sum(1 for p in json.load(sys.stdin) if p.get('pm2_env',{}).get('status')=='errored'))" 2>/dev/null || echo "0")
  
  if [ "$TOTAL" -gt 0 ]; then
    pass "PM2: $ONLINE/$TOTAL processes online"
    if [ "$ERRORED" -gt 0 ]; then
      fail "PM2: $ERRORED processes in errored state"
      echo "$PM2_JSON" | python3 -c "
import sys, json
for p in json.load(sys.stdin):
  status = p.get('pm2_env',{}).get('status','?')
  if status == 'errored':
    print(f'    → {p[\"name\"]}: {status}')
" 2>/dev/null || true
    fi
  else
    warn "No PM2 processes found"
  fi
else
  warn "PM2 not found in PATH"
fi

echo ""

# ── 4. Disk & System ────────────────────────────────────────────
echo "── System Resources ──"

DISK_PCT=$(df / --output=pcent 2>/dev/null | tail -1 | tr -d '% ')
if [ -n "$DISK_PCT" ]; then
  if [ "$DISK_PCT" -lt 80 ]; then
    pass "Disk usage: ${DISK_PCT}%"
  elif [ "$DISK_PCT" -lt 90 ]; then
    warn "Disk usage: ${DISK_PCT}% (getting full)"
  else
    fail "Disk usage: ${DISK_PCT}% (critical!)"
  fi
fi

MEM_PCT=$(free | awk '/Mem:/ {printf "%.0f", $3/$2*100}' 2>/dev/null)
if [ -n "$MEM_PCT" ]; then
  if [ "$MEM_PCT" -lt 85 ]; then
    pass "Memory usage: ${MEM_PCT}%"
  else
    warn "Memory usage: ${MEM_PCT}%"
  fi
fi

echo ""

# ── 5. Git Status ────────────────────────────────────────────────
echo "── Git Status ──"

REPO_DIR="/home/goodclaw/gooddollar-l2"
if [ -d "$REPO_DIR/.git" ]; then
  cd "$REPO_DIR"
  
  # Current version
  VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")
  pass "Package version: v$VERSION"
  
  # Current branch and commit
  BRANCH=$(git branch --show-current 2>/dev/null || echo "detached")
  COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
  pass "Branch: $BRANCH @ $COMMIT"
  
  # Uncommitted changes
  DIRTY=$(git status --porcelain 2>/dev/null | wc -l)
  if [ "$DIRTY" -eq 0 ]; then
    pass "Working tree clean"
  else
    warn "$DIRTY uncommitted changes"
  fi
  
  # Unpushed commits
  UNPUSHED=$(git log origin/main..HEAD --oneline 2>/dev/null | wc -l)
  if [ "$UNPUSHED" -eq 0 ]; then
    pass "Up to date with origin/main"
  else
    warn "$UNPUSHED unpushed commits"
  fi
fi

echo ""
echo "═══════════════════════════════════════════"
if [ "$FAILURES" -gt 0 ]; then
  echo -e " Result: ${RED}$FAILURES failures${NC}, $WARNINGS warnings"
  exit 1
elif [ "$WARNINGS" -gt 0 ]; then
  echo -e " Result: ${GREEN}OK${NC} with ${YELLOW}$WARNINGS warnings${NC}"
  exit 0
else
  echo -e " Result: ${GREEN}All systems healthy${NC}"
  exit 0
fi
