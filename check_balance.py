#!/usr/bin/env python3
"""Check tester wallet balances and contract state on devnet via JSON-RPC."""
import urllib.request, json

RPC = "http://localhost:8545"
TESTER_ALPHA = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
TESTER_ALPHA_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
ADMIN_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

GOODDOLLAR = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
MOCK_USDC = "0x0b306bf915c4d645ff596e518faf3f9669b97016"
MOCK_WETH = "0x959922be3caee4b8cd9a407cc3ac1c251c2007b1"
GOOD_LEND = "0x322813fd9a801c5507c9de605d63cea4f2ce6c44"

def rpc_call(method, params):
    data = json.dumps({"jsonrpc": "2.0", "method": method, "params": params, "id": 1}).encode()
    req = urllib.request.Request(RPC, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return json.loads(r.read())
    except Exception as e:
        return {"error": str(e)}

def get_eth_balance(addr):
    res = rpc_call("eth_getBalance", [addr, "latest"])
    if "result" in res:
        return int(res["result"], 16) / 1e18
    return None

def call_contract(to, data):
    res = rpc_call("eth_call", [{"to": to, "data": data}, "latest"])
    if "result" in res:
        return res["result"]
    return None

def erc20_balance(token, addr):
    # balanceOf(address) = 0x70a08231
    padded = addr[2:].lower().zfill(64)
    data = "0x70a08231" + padded
    raw = call_contract(token, data)
    if raw and raw != "0x":
        return int(raw, 16) / 1e18
    return None

def erc20_symbol(token):
    # symbol() = 0x95d89b41
    raw = call_contract(token, "0x95d89b41")
    if raw and len(raw) > 2:
        try:
            s = bytes.fromhex(raw[2:])
            offset = int.from_bytes(s[0:32], 'big')
            length = int.from_bytes(s[32:64], 'big')
            return s[64:64+length].decode('utf-8', errors='ignore')
        except Exception:
            return raw[:10]
    return "?"

print("=== Devnet connectivity ===")
chain_id = rpc_call("eth_chainId", [])
print("Chain ID:", int(chain_id.get("result", "0x0"), 16))
block = rpc_call("eth_blockNumber", [])
print("Block:", int(block.get("result", "0x0"), 16))

print("\n=== Tester Alpha wallet ===")
eth_bal = get_eth_balance(TESTER_ALPHA)
print(f"ETH: {eth_bal}")

for name, addr in [("GoodDollar", GOODDOLLAR), ("MockUSDC", MOCK_USDC), ("MockWETH", MOCK_WETH)]:
    bal = erc20_balance(addr, TESTER_ALPHA)
    sym = erc20_symbol(addr)
    print(f"{name} ({sym}): {bal}")

print("\n=== GoodLendPool ===")
lp_usdc = erc20_balance(MOCK_USDC, GOOD_LEND)
lp_weth = erc20_balance(MOCK_WETH, GOOD_LEND)
print(f"Pool MockUSDC: {lp_usdc}")
print(f"Pool MockWETH: {lp_weth}")
