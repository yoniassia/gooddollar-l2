#!/bin/bash
# Start GoodDollar L2 devnet
# Usage: ./start.sh [--clean]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[GoodDollar L2]${NC} $1"; }
warn() { echo -e "${YELLOW}[GoodDollar L2]${NC} $1"; }
err() { echo -e "${RED}[GoodDollar L2]${NC} $1"; }

# Clean option
if [ "${1:-}" = "--clean" ]; then
    warn "Cleaning previous state..."
    docker compose down -v 2>/dev/null || true
fi

# Check prerequisites
if ! command -v docker &>/dev/null; then
    err "Docker not found. Install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker compose version &>/dev/null; then
    err "Docker Compose not found. Install: https://docs.docker.com/compose/install/"
    exit 1
fi

# Ensure JWT secret exists
if [ ! -f jwt.txt ]; then
    log "Generating JWT secret..."
    openssl rand -hex 32 > jwt.txt
fi

# Ensure genesis exists
if [ ! -f genesis.json ]; then
    err "genesis.json not found! Run generate-genesis.sh first."
    exit 1
fi

log "Starting GoodDollar L2 devnet..."
log "  L1 (Anvil):  http://localhost:8546"
log "  L2 (op-geth): http://localhost:8545"
log "  Rollup Node:  http://localhost:9545"
log ""

docker compose up -d

log "Waiting for services to start..."

# Wait for L1
for i in $(seq 1 30); do
    if curl -s http://localhost:8546 -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' >/dev/null 2>&1; then
        log "L1 Anvil is ready"
        break
    fi
    sleep 2
done

# Wait for L2
for i in $(seq 1 60); do
    if curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' >/dev/null 2>&1; then
        L2_BLOCK=$(curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | python3 -c "import sys,json; print(int(json.load(sys.stdin)['result'], 16))" 2>/dev/null || echo "0")
        log "L2 op-geth is ready (block $L2_BLOCK)"
        break
    fi
    sleep 2
done

echo ""
log "=============================="
log " GoodDollar L2 Devnet Running"
log "=============================="
log ""
log "  L1 RPC:      http://localhost:8546"
log "  L2 RPC:      http://localhost:8545"
log "  Rollup Node: http://localhost:9545"
log "  Chain ID:    42069"
log ""
log "  Contract Addresses:"
log "    GoodDollarToken:  0x4200000000000000000000000000000000000100"
log "    UBIFeeSplitter:   0x4200000000000000000000000000000000000101"
log "    ValidatorStaking: 0x4200000000000000000000000000000000000102"
log "    UBIFeeHook:       0x4200000000000000000000000000000000000103"
log ""
log "  Stop with: docker compose down"
log "  Clean:     docker compose down -v"
