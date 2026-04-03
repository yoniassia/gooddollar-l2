#!/bin/bash
set -e
export PATH="/home/goodclaw/.foundry/bin:$PATH"
cd /home/goodclaw/gooddollar-l2

DEVNET_RPC="https://rpc.goodclaw.org"

echo "Running RedeployUBIFeeHook script..."
forge script script/RedeployUBIFeeHook.s.sol \
    --rpc-url "$DEVNET_RPC" \
    --broadcast \
    --legacy \
    2>&1

echo "Done."
