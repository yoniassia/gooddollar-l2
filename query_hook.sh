#!/bin/bash
export PATH="/home/goodclaw/.foundry/bin:$PATH"
HOOK="0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
RPC="http://localhost:8545"
echo "poolManager: $(cast call $HOOK 'poolManager()(address)' --rpc-url $RPC)"
echo "ubiPool:     $(cast call $HOOK 'ubiPool()(address)' --rpc-url $RPC)"
echo "ubiFeeShareBPS: $(cast call $HOOK 'ubiFeeShareBPS()(uint256)' --rpc-url $RPC)"
echo "admin:       $(cast call $HOOK 'admin()(address)' --rpc-url $RPC)"
echo "paused:      $(cast call $HOOK 'paused()(bool)' --rpc-url $RPC)"
