#!/usr/bin/env python3
"""Debug why GoodLendPool borrow is reverting."""
import json, urllib.request

RPC = "http://localhost:8545"
MY_ADDR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
MOCK_USDC = "0x0b306bf915c4d645ff596e518faf3f9669b97016"
MOCK_WETH = "0x959922be3caee4b8cd9a407cc3ac1c251c2007b1"
GOOD_LEND = "0x322813fd9a801c5507c9de605d63cea4f2ce6c44"
SIMPLE_ORACLE = None  # will discover

def rpc(method, params):
    data = json.dumps({"jsonrpc": "2.0", "method": method, "params": params, "id": 1}).encode()
    req = urllib.request.Request(RPC, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())

def call(to, fn_data):
    res = rpc("eth_call", [{"to": to, "data": fn_data, "from": MY_ADDR}, "latest"])
    return res

def encode_addr(addr):
    return addr[2:].lower().zfill(64)

def encode_uint(n):
    return hex(n)[2:].zfill(64)

# 1. Try to get reserve data for USDC and WETH
# getReserveData(address) - need selector
# Let's try the failed borrow TX trace
last_block = rpc("eth_blockNumber", [])
block = int(last_block["result"], 16)
print("Current block:", block)

# Try borrow via eth_call (same state)
borrow_data = "0x4b8a3529" + encode_addr(MOCK_USDC) + encode_uint(5_000 * 10**6)
result = call(GOOD_LEND, borrow_data)
print("\nBorrow eth_call:", json.dumps(result))

# Decode revert message if present
err = result.get("error", {})
data_hex = err.get("data", "")
if data_hex and len(data_hex) > 10:
    # Check if it's a string revert: 0x08c379a0 + offset + length + string
    if data_hex.startswith("0x08c379a0"):
        try:
            raw = bytes.fromhex(data_hex[2:])
            # 4 bytes selector, 32 bytes offset, 32 bytes length, string
            length = int.from_bytes(raw[36:68], 'big')
            msg = raw[68:68+length].decode('utf-8', errors='replace')
            print("Revert reason:", msg)
        except Exception as e:
            print("Decode err:", e)
    else:
        print("Revert data:", data_hex[:100])
else:
    print("No revert data in error")

# Check if USDC reserve is configured/active
# Try calling getReserveData — various selectors
# getReserveData(address) Aave-style = 0x35ea6a75
result2 = call(GOOD_LEND, "0x35ea6a75" + encode_addr(MOCK_USDC))
print("\ngetReserveData(USDC):", json.dumps(result2))

# Check oracle
# Try SimplePriceOracle getAssetPrice
# First get oracle address from pool
# priceOracle() = 0x0261bf0b (Aave) or custom
result3 = call(GOOD_LEND, "0x0261bf0b")  # priceOracle()
print("\npriceOracle():", json.dumps(result3))

# Check if borrow is enabled — reading reserves mapping
# mapping(address => ReserveData) at slot 0 typically
# Let's check by reading slot 0 to find where reserves are stored
slot0 = rpc("eth_getStorageAt", [GOOD_LEND, "0x0", "latest"])
print("\nGoodLendPool slot0:", slot0)

# Try debug_traceTransaction on the last borrow tx
# Get recent transactions from last block
block_data = rpc("eth_getBlockByNumber", [hex(block), True])
txs = block_data.get("result", {}).get("transactions", [])
print(f"\nLast block {block} has {len(txs)} txs")
for tx in txs[-3:]:
    print(f"  tx: {tx['hash'][:20]}... to={tx.get('to','')[:20]} input={tx.get('input','')[:20]}")
