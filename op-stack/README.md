# GoodDollar L2 — OP Stack Devnet

Local development environment for GoodDollar L2 using Docker Compose.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) with Docker Compose
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (for `cast` CLI in smoke tests)

## Quick Start

```bash
# 1. Start the devnet
./start.sh

# 2. Run smoke tests
./smoke-test.sh

# 3. Stop when done
./stop.sh

# Clean restart (removes all state)
./start.sh --clean
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GoodDollar L2 Devnet                      │
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌───────────┐              │
│  │ L1 Anvil │◄───│ op-node  │───►│  op-geth  │              │
│  │ :8546    │    │ :9545    │    │  :8545    │              │
│  └────┬─────┘    └──────────┘    └───────────┘              │
│       │                                                      │
│  ┌────┴─────┐    ┌───────────┐                              │
│  │op-batcher│    │op-proposer│                              │
│  │ :8548    │    │ :8560     │                              │
│  └──────────┘    └───────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

## Endpoints

| Service      | URL                     | Description                |
|-------------|-------------------------|----------------------------|
| L1 RPC      | http://localhost:8546   | Ethereum L1 (Anvil)        |
| L2 RPC      | http://localhost:8545   | GoodDollar L2 (op-geth)    |
| Rollup Node | http://localhost:9545   | OP Stack rollup node       |
| Batcher     | http://localhost:8548   | Batch submitter            |
| Proposer    | http://localhost:8560   | Output root proposer       |

## Chain Configuration

| Parameter     | Value                          |
|--------------|--------------------------------|
| Chain ID     | 42069                          |
| Block Time   | 1 second                       |
| Gas Token    | ETH (Phase 1)                  |
| L1 Chain ID  | 31337 (local Anvil)            |

## Pre-deployed Contracts

| Contract          | Address                                      |
|-------------------|----------------------------------------------|
| GoodDollarToken   | `0x4200000000000000000000000000000000000100`  |
| UBIFeeSplitter    | `0x4200000000000000000000000000000000000101`  |
| ValidatorStaking  | `0x4200000000000000000000000000000000000102`  |
| UBIFeeHook        | `0x4200000000000000000000000000000000000103`  |

## Default Accounts

The devnet uses Anvil's default accounts (same private keys as Hardhat/Foundry):

| Account | Address | Role |
|---------|---------|------|
| #0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | Admin / Sequencer / Batcher / Proposer |
| #1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | Test user |
| #2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | Test user |

All test accounts are pre-funded with 10,000 ETH.

## Files

```
op-stack/
├── docker-compose.yml     # Service orchestration
├── genesis.json           # L2 genesis with pre-deployed contracts
├── rollup.json            # OP Stack rollup configuration
├── addresses.json         # All contract addresses
├── chain.ts               # viem/wagmi chain definition
├── jwt.txt                # Engine API JWT secret
├── generate-genesis.sh    # Regenerate genesis from Foundry artifacts
├── start.sh               # Start devnet
├── stop.sh                # Stop devnet
├── smoke-test.sh          # Verify devnet health
└── README.md              # This file
```

## Regenerating Genesis

If you modify the Solidity contracts, regenerate the genesis:

```bash
cd ..
forge build
cd op-stack
bash generate-genesis.sh genesis.json
```

## Troubleshooting

**Services won't start:**
```bash
docker compose logs -f   # Check service logs
```

**Clean restart:**
```bash
./start.sh --clean       # Removes all volumes and state
```

**Port conflicts:**
Ensure ports 8545, 8546, 8548, 8551, 8560, 9545 are available.
