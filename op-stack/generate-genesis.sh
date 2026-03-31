#!/bin/bash
# Generate genesis.json for GoodDollar L2 devnet
# Reads compiled contract bytecodes from Foundry artifacts and creates
# a genesis file with pre-deployed contracts at deterministic addresses.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUT_DIR="$PROJECT_DIR/out"
GENESIS_FILE="$SCRIPT_DIR/genesis.json"

echo "Generating GoodDollar L2 genesis..."

# Pre-deployed contract addresses (0x4200... range for custom contracts)
GD_TOKEN_ADDR="0x4200000000000000000000000000000000000100"
FEE_SPLITTER_ADDR="0x4200000000000000000000000000000000000101"
VALIDATOR_STAKING_ADDR="0x4200000000000000000000000000000000000102"
UBI_FEE_HOOK_ADDR="0x4200000000000000000000000000000000000103"

# Admin/deployer address (devnet only)
ADMIN_ADDR="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

# Extract deployed bytecodes from Foundry artifacts
extract_bytecode() {
    local artifact="$OUT_DIR/$1/$2"
    if [ -f "$artifact" ]; then
        python3 -c "import json; print(json.load(open('$artifact'))['deployedBytecode']['object'])"
    else
        echo "ERROR: Artifact not found: $artifact" >&2
        return 1
    fi
}

GD_BYTECODE=$(extract_bytecode "GoodDollarToken.sol" "GoodDollarToken.json")
SPLITTER_BYTECODE=$(extract_bytecode "UBIFeeSplitter.sol" "UBIFeeSplitter.json")
STAKING_BYTECODE=$(extract_bytecode "ValidatorStaking.sol" "ValidatorStaking.json")
HOOK_BYTECODE=$(extract_bytecode "UBIFeeHook.sol" "UBIFeeHook.json")

python3 << 'PYTHON_SCRIPT'
import json
import sys

CHAIN_ID = 42069
ADMIN = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
INITIAL_BALANCE = "0x200000000000000000000000000000000000000000000000000000000000000"

genesis = {
    "config": {
        "chainId": CHAIN_ID,
        "homesteadBlock": 0,
        "eip150Block": 0,
        "eip155Block": 0,
        "eip158Block": 0,
        "byzantiumBlock": 0,
        "constantinopleBlock": 0,
        "petersburgBlock": 0,
        "istanbulBlock": 0,
        "muirGlacierBlock": 0,
        "berlinBlock": 0,
        "londonBlock": 0,
        "arrowGlacierBlock": 0,
        "grayGlacierBlock": 0,
        "mergeNetsplitBlock": 0,
        "shanghaiTime": 0,
        "cancunTime": 0,
        "terminalTotalDifficulty": 0,
        "terminalTotalDifficultyPassed": True,
        "bedrockBlock": 0,
        "regolithTime": 0,
        "canyonTime": 0,
        "ecotoneTime": 0,
        "optimism": {
            "eip1559Elasticity": 6,
            "eip1559Denominator": 50,
            "eip1559DenominatorCanyon": 250
        }
    },
    "difficulty": "0x0",
    "gasLimit": "0x1C9C380",
    "extradata": "0x" + "00" * 32,
    "alloc": {}
}

# Sequencer / admin account with large ETH balance
genesis["alloc"][ADMIN.lower()] = {
    "balance": INITIAL_BALANCE
}

# Funded test accounts (Anvil default accounts)
test_accounts = [
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
]
for acc in test_accounts:
    genesis["alloc"][acc.lower()] = {
        "balance": "0x21E19E0C9BAB2400000"  # 10,000 ETH
    }

# OP Stack system contracts (L2 predeploys at 0x4200...)
op_system_contracts = {
    "0x4200000000000000000000000000000000000006": "WETH9",
    "0x4200000000000000000000000000000000000007": "L2CrossDomainMessenger",
    "0x4200000000000000000000000000000000000010": "L2StandardBridge",
    "0x4200000000000000000000000000000000000011": "SequencerFeeVault",
    "0x4200000000000000000000000000000000000012": "OptimismMintableERC20Factory",
    "0x4200000000000000000000000000000000000013": "L1BlockNumber",
    "0x4200000000000000000000000000000000000015": "L1Block",
    "0x4200000000000000000000000000000000000016": "GasPriceOracle",
    "0x4200000000000000000000000000000000000017": "L2ToL1MessagePasser",
    "0x4200000000000000000000000000000000000018": "L2ERC721Bridge",
    "0x4200000000000000000000000000000000000019": "OptimismMintableERC721Factory",
    "0x4200000000000000000000000000000000000020": "SchemaRegistry",
    "0x4200000000000000000000000000000000000021": "EAS",
}
# Placeholder bytecode for OP system contracts (replaced by actual OP Stack deployment)
for addr, name in op_system_contracts.items():
    genesis["alloc"][addr.lower()] = {
        "balance": "0x0",
        "code": "0x00",
        "comment": f"Placeholder for {name} — replaced by op-geth genesis generation"
    }

# GoodDollar custom contracts
import os
gd_bytecode = os.environ.get("GD_BYTECODE", "0x00")
splitter_bytecode = os.environ.get("SPLITTER_BYTECODE", "0x00")
staking_bytecode = os.environ.get("STAKING_BYTECODE", "0x00")
hook_bytecode = os.environ.get("HOOK_BYTECODE", "0x00")

custom_contracts = {
    "0x4200000000000000000000000000000000000100": {
        "name": "GoodDollarToken",
        "code": gd_bytecode,
        "balance": "0x0",
    },
    "0x4200000000000000000000000000000000000101": {
        "name": "UBIFeeSplitter",
        "code": splitter_bytecode,
        "balance": "0x0",
    },
    "0x4200000000000000000000000000000000000102": {
        "name": "ValidatorStaking",
        "code": staking_bytecode,
        "balance": "0x0",
    },
    "0x4200000000000000000000000000000000000103": {
        "name": "UBIFeeHook",
        "code": hook_bytecode,
        "balance": "0x0",
    },
}

for addr, info in custom_contracts.items():
    genesis["alloc"][addr.lower()] = {
        "balance": info["balance"],
        "code": info["code"],
        "comment": info["name"],
    }

with open(sys.argv[1] if len(sys.argv) > 1 else "genesis.json", "w") as f:
    json.dump(genesis, f, indent=2)

print(f"Genesis written with {len(genesis['alloc'])} accounts")
print(f"  Chain ID: {CHAIN_ID}")
print(f"  GoodDollarToken:    0x4200000000000000000000000000000000000100")
print(f"  UBIFeeSplitter:     0x4200000000000000000000000000000000000101")
print(f"  ValidatorStaking:   0x4200000000000000000000000000000000000102")
print(f"  UBIFeeHook:         0x4200000000000000000000000000000000000103")
PYTHON_SCRIPT
