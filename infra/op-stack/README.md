# GoodDollar L2 — OP Stack Configuration

## Overview

Migration plan from Anvil devnet to a full OP Stack rollup:

- **op-geth**: L2 execution engine (modified go-ethereum)
- **op-node**: L2 consensus/derivation (reads L1, drives op-geth)
- **op-batcher**: Batches L2 transactions and posts to L1
- **op-proposer**: Posts L2 output roots to L1 for withdrawals

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  L1 (Anvil/Sepolia)              │
│  OptimismPortal · L2OutputOracle · SystemConfig  │
└─────────────┬───────────────────────┬───────────┘
              │ derivation            │ batch posting
         ┌────▼────┐           ┌─────▼─────┐
         │ op-node │           │ op-batcher │
         └────┬────┘           └───────────┘
              │ engine API
         ┌────▼────┐
         │ op-geth │ ← L2 execution (chain ID 42069)
         └─────────┘
```

## Current State: Anvil Devnet

- Single-node Anvil on localhost:8545
- Chain ID: 42069
- Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

## Migration Path

### Phase 1: Docker Compose (local)
- L1 Anvil + OP Stack components in Docker
- Preserve chain ID 42069 and deployer keys
- All existing contracts redeployed to new chain

### Phase 2: Testnet
- L1 → Sepolia
- Public RPC endpoint

### Phase 3: Mainnet
- L1 → Ethereum mainnet
- Decentralized sequencer set

## Files

- `docker-compose.yml` — Full OP Stack local devnet
- `genesis.json` — L2 genesis configuration
- `rollup.json` — Rollup derivation config
- `deploy-l1.sh` — Deploy L1 bridge contracts
- `migrate.sh` — Redeploy all GoodDollar contracts to new chain
