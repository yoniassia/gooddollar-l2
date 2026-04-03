#!/usr/bin/env python3
"""Debug GoodLendPool borrow revert — check reserve config and health factor."""
import json, urllib.request

RPC = "http://localhost:8545"
MY_ADDR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
MOCK_USDC = "0x0b306bf915c4d645ff596e518faf3f9669b97016"
MOCK_WETH = "0x959922be3caee4b8cd9a407cc3ac1c251c2007b1"
GOOD_LEND = "0x322813fd9a801c5507c9de605d63cea4f2ce6c44"

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

def decode_uint(hex_str, offset=0):
    chunk = hex_str[2+offset*64:2+(offset+1)*64]
    return int(chunk, 16) if chunk else 0

# 1. getReserveData for USDC
print("=== USDC Reserve Data ===")
result = call(GOOD_LEND, "0x35ea6a75" + encode_addr(MOCK_USDC))
raw = result.get("result", "0x")
if raw and raw != "0x":
    words = [(raw[2+i*64:2+(i+1)*64]) for i in range(len(raw[2:])//64)]
    labels = ["totalDeposits","totalBorrows","liquidityIndex","borrowIndex","supplyRate","borrowRate","lastUpdateTimestamp","decimals"]
    for i, (label, word) in enumerate(zip(labels, words)):
        val = int(word, 16)
        print(f"  {label}: {val}")
else:
    print("  Error:", result)

# 2. getReserveData for WETH
print("\n=== WETH Reserve Data ===")
result = call(GOOD_LEND, "0x35ea6a75" + encode_addr(MOCK_WETH))
raw = result.get("result", "0x")
if raw and raw != "0x":
    words = [(raw[2+i*64:2+(i+1)*64]) for i in range(len(raw[2:])//64)]
    labels = ["totalDeposits","totalBorrows","liquidityIndex","borrowIndex","supplyRate","borrowRate","lastUpdateTimestamp","decimals"]
    for i, (label, word) in enumerate(zip(labels, words)):
        val = int(word, 16)
        print(f"  {label}: {val}")
else:
    print("  Error:", result)

# 3. getUserAccountData
print("\n=== User Account Data ===")
result = call(GOOD_LEND, "0xbf92857c" + encode_addr(MY_ADDR))
raw = result.get("result", "0x")
if raw and raw != "0x":
    words = [(raw[2+i*64:2+(i+1)*64]) for i in range(len(raw[2:])//64)]
    labels = ["totalCollateral","totalDebt","availableBorrow","healthFactor","ltv","liquidationThreshold"]
    for i, (label, word) in enumerate(zip(labels, words)):
        val = int(word, 16)
        print(f"  {label}: {val}")
    # Health factor is in RAY (1e27)
    if len(words) >= 4:
        hf = int(words[3], 16)
        print(f"  healthFactor (human): {hf / 1e27:.4f}")
else:
    print("  Error:", result)

# 4. Check reserves struct (borrowingEnabled flag)
print("\n=== Reserves struct USDC (raw slot read) ===")
result = call(GOOD_LEND, "0xd66bd524" + encode_addr(MOCK_USDC))
raw = result.get("result", "0x")
if raw and raw != "0x":
    # ReserveData is a large struct - print all fields
    words = [(raw[2+i*64:2+(i+1)*64]) for i in range(len(raw[2:])//64)]
    for i, word in enumerate(words):
        print(f"  word[{i}]: 0x{word} ({int(word, 16)})")
else:
    print("  Error:", result)

# 5. Check oracle address
print("\n=== Oracle ===")
result = call(GOOD_LEND, "0x7dc0d1d0")  # oracle()
raw = result.get("result", "0x")
if raw and raw != "0x":
    oracle_addr = "0x" + raw[-40:]
    print(f"  Oracle: {oracle_addr}")
    # Check WETH price
    # getAssetPrice(address) = ?
    # SimplePriceOracle from tests
    # Try Aave-style: getAssetPrice(address) = 0xb3596f07
    price_result = rpc("eth_call", [{"to": oracle_addr, "data": "0xb3596f07" + encode_addr(MOCK_WETH), "from": MY_ADDR}, "latest"])
    print(f"  WETH price (0xb3596f07): {price_result}")
    # Try another selector
    price_result2 = rpc("eth_call", [{"to": oracle_addr, "data": "0x41976e09" + encode_addr(MOCK_WETH), "from": MY_ADDR}, "latest"])
    print(f"  WETH price (0x41976e09): {price_result2}")
    # getPrice(address) = ? look in SimplePriceOracle
else:
    print("  Error:", result)
