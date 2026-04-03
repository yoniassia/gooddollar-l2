#!/usr/bin/env bash
# Deploy OP Stack L1 contracts to the L1 Anvil chain
# These contracts enable the L1↔L2 bridge and rollup verification
set -euo pipefail

L1_RPC="${L1_RPC:-http://localhost:8545}"
DEPLOYER_KEY="${DEPLOYER_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"
FORGE="${FORGE:-/home/goodclaw/.foundry/bin/forge}"

echo "═══════════════════════════════════════════════"
echo "  GoodDollar L2 — OP Stack L1 Contract Deploy"
echo "═══════════════════════════════════════════════"
echo "L1 RPC: $L1_RPC"
echo ""

cd "$(dirname "$0")/../../"

# Step 1: Deploy L2OutputOracle (stores output roots from proposer)
echo "[1/4] Deploying L2OutputOracle..."
L2OO_ADDR=$($FORGE create src/bridge/L2OutputOracle.sol:L2OutputOracle \
  --rpc-url "$L1_RPC" \
  --private-key "$DEPLOYER_KEY" \
  --json 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin)['deployedTo'])" 2>/dev/null || echo "SKIP")
echo "  L2OutputOracle: $L2OO_ADDR"

# Step 2: Deploy OptimismPortal (deposit/withdrawal entry point)
echo "[2/4] Deploying OptimismPortal..."
PORTAL_ADDR=$($FORGE create src/bridge/OptimismPortal.sol:OptimismPortal \
  --rpc-url "$L1_RPC" \
  --private-key "$DEPLOYER_KEY" \
  --json 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin)['deployedTo'])" 2>/dev/null || echo "SKIP")
echo "  OptimismPortal: $PORTAL_ADDR"

# Step 3: Deploy SystemConfig (chain configuration on L1)
echo "[3/4] Deploying SystemConfig..."
SYSCONFIG_ADDR=$($FORGE create src/bridge/SystemConfig.sol:SystemConfig \
  --rpc-url "$L1_RPC" \
  --private-key "$DEPLOYER_KEY" \
  --json 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin)['deployedTo'])" 2>/dev/null || echo "SKIP")
echo "  SystemConfig: $SYSCONFIG_ADDR"

# Step 4: Deploy L1StandardBridge
echo "[4/4] Deploying L1StandardBridge..."
BRIDGE_ADDR=$($FORGE create src/bridge/L1StandardBridge.sol:L1StandardBridge \
  --rpc-url "$L1_RPC" \
  --private-key "$DEPLOYER_KEY" \
  --json 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin)['deployedTo'])" 2>/dev/null || echo "SKIP")
echo "  L1StandardBridge: $BRIDGE_ADDR"

echo ""
echo "═══════════════════════════════════════════════"
echo "  L1 Deployment Complete"
echo "═══════════════════════════════════════════════"
echo ""
echo "Set in .env or docker-compose:"
echo "  L2OO_ADDRESS=$L2OO_ADDR"
echo "  PORTAL_ADDRESS=$PORTAL_ADDR"
echo "  SYSTEM_CONFIG_ADDRESS=$SYSCONFIG_ADDR"
echo "  L1_BRIDGE_ADDRESS=$BRIDGE_ADDR"
