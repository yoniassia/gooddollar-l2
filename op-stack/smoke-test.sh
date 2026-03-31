#!/bin/bash
# Smoke test for GoodDollar L2 devnet
# Verifies: L1 running, L2 running, can send tx, pre-deployed contracts accessible

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0

check() {
    local name="$1"
    local cmd="$2"
    if eval "$cmd" >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} $name"
        ((PASS++))
    else
        echo -e "  ${RED}✗${NC} $name"
        ((FAIL++))
    fi
}

L1_RPC="http://localhost:8546"
L2_RPC="http://localhost:8545"

echo "GoodDollar L2 Smoke Test"
echo "========================"
echo ""

echo "1. Network Connectivity"
check "L1 Anvil responds" "cast block-number --rpc-url $L1_RPC"
check "L2 op-geth responds" "cast block-number --rpc-url $L2_RPC"
check "L2 chain ID = 42069" "[ \$(cast chain-id --rpc-url $L2_RPC) = '42069' ]"

echo ""
echo "2. Pre-deployed Contracts"
GD_ADDR="0x4200000000000000000000000000000000000100"
SPLITTER_ADDR="0x4200000000000000000000000000000000000101"
STAKING_ADDR="0x4200000000000000000000000000000000000102"
HOOK_ADDR="0x4200000000000000000000000000000000000103"

check "GoodDollarToken has code" "[ \$(cast code $GD_ADDR --rpc-url $L2_RPC | wc -c) -gt 4 ]"
check "UBIFeeSplitter has code" "[ \$(cast code $SPLITTER_ADDR --rpc-url $L2_RPC | wc -c) -gt 4 ]"
check "ValidatorStaking has code" "[ \$(cast code $STAKING_ADDR --rpc-url $L2_RPC | wc -c) -gt 4 ]"
check "UBIFeeHook has code" "[ \$(cast code $HOOK_ADDR --rpc-url $L2_RPC | wc -c) -gt 4 ]"

echo ""
echo "3. Transaction Execution"
# Send a simple ETH transfer on L2
DEPLOYER_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
TO_ADDR="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
check "ETH transfer on L2" "cast send --rpc-url $L2_RPC --private-key $DEPLOYER_KEY $TO_ADDR --value 1ether"

echo ""
echo "4. Block Production"
BLOCK_NUM=$(cast block-number --rpc-url $L2_RPC 2>/dev/null || echo "0")
check "L2 producing blocks (block $BLOCK_NUM)" "[ $BLOCK_NUM -gt 0 ]"

echo ""
echo "========================"
echo -e "Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"
echo ""

if [ $FAIL -gt 0 ]; then
    echo -e "${RED}Some tests failed. Check docker compose logs for details.${NC}"
    exit 1
else
    echo -e "${GREEN}All smoke tests passed!${NC}"
fi
