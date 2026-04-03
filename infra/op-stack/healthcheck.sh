#!/usr/bin/env bash
# GoodDollar L2 — OP Stack Health Check
# Checks all components of the OP Stack devnet
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/.env" 2>/dev/null || true

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

check() {
  local name=$1 cmd=$2
  result=$(eval "$cmd" 2>/dev/null) && echo -e "${GREEN}✓${NC} $name: $result" || { echo -e "${RED}✗${NC} $name: FAILED"; ((ERRORS++)); }
}

echo "═══════════════════════════════════════════════"
echo "  GoodDollar L2 — OP Stack Health Check"
echo "═══════════════════════════════════════════════"
echo ""

# Chain connectivity
check "L1 RPC (chain 900)" "cast chain-id --rpc-url http://localhost:8545"
check "L2 RPC (chain 42069)" "cast chain-id --rpc-url http://localhost:9545"
check "L1 block number" "cast block-number --rpc-url http://localhost:8545"
check "L2 block number" "cast block-number --rpc-url http://localhost:9545"

# L1 contracts
echo ""
echo "L1 Contracts:"
for contract in L2OO_ADDRESS PORTAL_ADDRESS SYSTEM_CONFIG_ADDRESS L1_BRIDGE_ADDRESS; do
  addr="${!contract:-}"
  if [ -n "$addr" ]; then
    code=$(cast code "$addr" --rpc-url http://localhost:8545 2>/dev/null || echo "0x")
    if [ "$code" != "0x" ] && [ -n "$code" ]; then
      echo -e "  ${GREEN}✓${NC} $contract: $addr"
    else
      echo -e "  ${RED}✗${NC} $contract: $addr (no code)"
      ((ERRORS++))
    fi
  fi
done

# Docker services
echo ""
echo "Docker Services:"
cd "$SCRIPT_DIR"
for svc in l1-anvil op-geth op-node op-batcher op-proposer; do
  status=$(docker compose ps --format "{{.Status}}" "$svc" 2>/dev/null || echo "not running")
  if echo "$status" | grep -qi "up\|running"; then
    echo -e "  ${GREEN}✓${NC} $svc: $status"
  else
    echo -e "  ${RED}✗${NC} $svc: $status"
    ((ERRORS++))
  fi
done

# Sequencer sync check
echo ""
echo "Sync Status:"
L1_HEAD=$(cast block-number --rpc-url http://localhost:8545 2>/dev/null || echo "0")
L2_HEAD=$(cast block-number --rpc-url http://localhost:9545 2>/dev/null || echo "0")
if [ "$L2_HEAD" != "0" ] && [ "$L1_HEAD" != "0" ]; then
  echo -e "  L1 head: $L1_HEAD"
  echo -e "  L2 head: $L2_HEAD"
  echo -e "  ${GREEN}✓${NC} Chain is producing blocks"
else
  echo -e "  ${YELLOW}!${NC} Cannot determine sync status"
fi

echo ""
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}All checks passed!${NC}"
else
  echo -e "${RED}$ERRORS check(s) failed${NC}"
fi
exit $ERRORS
