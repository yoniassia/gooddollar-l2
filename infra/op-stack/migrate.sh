#!/usr/bin/env bash
# Migrate all GoodDollar contracts from Anvil devnet to OP Stack L2
# Run this after docker-compose up has the L2 running
set -euo pipefail

L2_RPC="${L2_RPC:-http://localhost:9545}"
DEPLOYER_KEY="${DEPLOYER_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"
FORGE="${FORGE:-/home/goodclaw/.foundry/bin/forge}"

echo "═══════════════════════════════════════════════"
echo "  GoodDollar L2 — Contract Migration to OP Stack"
echo "═══════════════════════════════════════════════"
echo "L2 RPC: $L2_RPC"
echo ""

cd "$(dirname "$0")/../../"

# Run all deploy scripts in order
SCRIPTS=(
  "script/DeployGoodDollar.s.sol"
  "script/DeployGoodPool.s.sol"
  "script/DeployPerps.s.sol"
  "script/DeployPredict.s.sol"
  "script/DeployLending.s.sol"
  "script/DeployStable.s.sol"
  "script/DeployGoodStocks.s.sol"
  "script/DeployBridge.s.sol"
)

for script in "${SCRIPTS[@]}"; do
  name=$(basename "$script" .s.sol)
  if [ -f "$script" ]; then
    echo "──────────────────────────────────────"
    echo "Deploying: $name"
    echo "──────────────────────────────────────"
    $FORGE script "$script" \
      --rpc-url "$L2_RPC" \
      --private-key "$DEPLOYER_KEY" \
      --broadcast \
      --slow \
      2>&1 | tail -20
    echo ""
  else
    echo "⚠ Skipping $name (script not found)"
  fi
done

echo ""
echo "═══════════════════════════════════════════════"
echo "  Migration Complete!"
echo "═══════════════════════════════════════════════"
echo ""
echo "Update frontend/.env.local with new contract addresses"
echo "Update backend services with new RPC: $L2_RPC"
echo ""
echo "Verify contracts:"
echo "  $FORGE verify-contract <addr> <Contract> --chain-id 42069 --verifier blockscout --verifier-url http://localhost:4000/api"
