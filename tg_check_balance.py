#!/usr/bin/env python3
"""Check ETH balance via JSON-RPC directly."""
import json, urllib.request

RPC = "http://localhost:8545"
MY_ADDR = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"

def rpc(method, params):
    body = json.dumps({"jsonrpc":"2.0","id":1,"method":method,"params":params}).encode()
    req = urllib.request.Request(RPC, data=body, headers={"Content-Type":"application/json"})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

# Check ETH balance
result = rpc("eth_getBalance", [MY_ADDR, "latest"])
balance_wei = int(result["result"], 16)
balance_eth = balance_wei / 1e18
print("ETH balance:", balance_eth, "ETH")

# Check block number to confirm devnet is running
blk = rpc("eth_blockNumber", [])
print("Block number:", int(blk["result"], 16))

# Check chain ID
chain = rpc("eth_chainId", [])
print("Chain ID:", int(chain["result"], 16))
