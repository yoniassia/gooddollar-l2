#!/usr/bin/env python3
import json, urllib.request

RPC = "http://localhost:8545"
MY_ADDR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
LIFI = "0x8bce54ff8ab45cb075b044ae117b8fd91f9351ab"

def rpc(method, params):
    data = json.dumps({"jsonrpc": "2.0", "method": method, "params": params, "id": 1}).encode()
    req = urllib.request.Request(RPC, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())

def call(to, fn_data):
    return rpc("eth_call", [{"to": to, "data": fn_data, "from": MY_ADDR}, "latest"])

splitter_raw = call(LIFI, "0x72db3abf").get("result", "0x")
splitter = "0x" + splitter_raw[-40:]
print("ubiFeeSplitter:", splitter)

eth_bal = rpc("eth_getBalance", [splitter, "latest"])
print("Splitter ETH balance:", int(eth_bal.get("result","0x0"), 16))

# Check code at splitter
code = rpc("eth_getCode", [splitter, "latest"])
print("Splitter code size:", len(code.get("result","0x")) - 2, "bytes")
