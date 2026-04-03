#!/usr/bin/env bash
# GoodDollar L2 — Initialize and start the full OP Stack devnet
# Usage: ./init-and-start.sh [--reset]
#
# This replaces the single Anvil node with a proper OP Stack:
#   L1 (Anvil chain 900) → op-node → op-geth (chain 42069) + batcher + proposer
#
# --reset: Wipe all volumes and reinitialize from scratch
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

source .env 2>/dev/null || true

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${CYAN}[op-stack]${NC} $1"; }
ok()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn(){ echo -e "${YELLOW}[!]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ─── Pre-flight checks ──────────────────────────
command -v docker >/dev/null 2>&1 || err "Docker not found"
command -v docker compose >/dev/null 2>&1 || err "Docker Compose not found"
command -v cast >/dev/null 2>&1 || warn "cast not found — install foundry for health checks"

# ─── Handle --reset flag ────────────────────────
if [[ "${1:-}" == "--reset" ]]; then
  warn "Resetting all OP Stack volumes and containers..."
  docker compose -f docker-compose.yml down -v --remove-orphans 2>/dev/null || true
  ok "Clean slate"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  🟢 GoodDollar L2 — OP Stack Devnet Launcher"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  L1 Chain ID:  ${L1_CHAIN_ID:-900}"
echo "  L2 Chain ID:  ${L2_CHAIN_ID:-42069}"
echo "  L1 RPC:       http://localhost:8545"
echo "  L2 RPC:       http://localhost:9545"
echo ""

# ─── Step 1: Start L1 first ─────────────────────
log "Starting L1 (Anvil)..."
docker compose -f docker-compose.yml up -d l1-anvil
log "Waiting for L1 to be ready..."

for i in $(seq 1 30); do
  if cast block-number --rpc-url http://localhost:8545 >/dev/null 2>&1; then
    ok "L1 is live (block $(cast block-number --rpc-url http://localhost:8545))"
    break
  fi
  if [ $i -eq 30 ]; then err "L1 failed to start after 30s"; fi
  sleep 1
done

# ─── Step 2: Deploy L1 contracts if needed ───────
log "Checking L1 contracts..."
L2OO_CODE=$(cast code ${L2OO_ADDRESS:-0x0000000000000000000000000000000000000000} --rpc-url http://localhost:8545 2>/dev/null || echo "0x")

if [ "$L2OO_CODE" == "0x" ] || [ -z "$L2OO_CODE" ]; then
  log "L1 contracts not deployed — running deploy-l1.sh..."
  bash deploy-l1.sh
  ok "L1 contracts deployed"
else
  ok "L1 contracts already deployed"
fi

# ─── Step 3: Initialize op-geth if volume empty ──
log "Initializing op-geth with genesis..."
# Check if already initialized by trying to start
docker compose -f docker-compose.yml run --rm --entrypoint="" op-geth \
  sh -c "if [ ! -d /data/geth ]; then geth init --datadir=/data /config/genesis.json; echo 'INITIALIZED'; else echo 'ALREADY_INIT'; fi" 2>&1 || true
ok "op-geth genesis ready"

# ─── Step 4: Start all OP Stack components ───────
log "Starting full OP Stack..."
docker compose -f docker-compose.yml up -d

echo ""
log "Waiting for L2 RPC..."
for i in $(seq 1 60); do
  if cast chain-id --rpc-url http://localhost:9545 >/dev/null 2>&1; then
    CHAIN=$(cast chain-id --rpc-url http://localhost:9545)
    ok "L2 is live! Chain ID: $CHAIN"
    break
  fi
  if [ $i -eq 60 ]; then
    warn "L2 not responding after 60s — check: docker compose logs op-geth"
  fi
  sleep 1
done

# ─── Step 5: Health check ────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  📊 Health Check"
echo "═══════════════════════════════════════════════════════════"

L1_BLOCK=$(cast block-number --rpc-url http://localhost:8545 2>/dev/null || echo "?")
L2_BLOCK=$(cast block-number --rpc-url http://localhost:9545 2>/dev/null || echo "?")
L2_BALANCE=$(cast balance ${DEPLOYER_ADDR:-0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266} --rpc-url http://localhost:9545 2>/dev/null || echo "?")

echo "  L1 block:      $L1_BLOCK"
echo "  L2 block:      $L2_BLOCK"
echo "  Deployer ETH:  $L2_BALANCE"
echo ""
echo "  Services:"
docker compose -f docker-compose.yml ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null || docker compose -f docker-compose.yml ps
echo ""

# ─── Step 6: Next steps ─────────────────────────
echo "═══════════════════════════════════════════════════════════"
echo "  🚀 Next Steps"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  1. Migrate contracts:  bash migrate.sh"
echo "  2. Update frontend:    Edit frontend/.env.local → RPC=http://localhost:9545"
echo "  3. Run Blockscout:     Point to L2 at localhost:9545"
echo "  4. Monitor:            docker compose logs -f op-node"
echo ""
echo "  Stop:   docker compose -f docker-compose.yml down"
echo "  Reset:  $0 --reset"
echo ""
