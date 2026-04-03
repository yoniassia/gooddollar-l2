#!/usr/bin/env python3
"""Check if gToken has approved pool to spend USDC — expected bug."""
import json, urllib.request

RPC = "http://localhost:8545"
MY_ADDR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
MOCK_USDC = "0x0b306bf915c4d645ff596e518faf3f9669b97016"
MOCK_WETH = "0x959922be3caee4b8cd9a407cc3ac1c251c2007b1"
GOOD_LEND = "0x322813fd9a801c5507c9de605d63cea4f2ce6c44"

# gToken addresses from reserves(USDC) struct word[0]
GTOKEN_USDC = "0xa85233c63b9ee964add6f2cffe00fd84eb32338f"
GTOKEN_WETH = None  # will discover

def rpc(method, params):
    data = json.dumps({"jsonrpc": "2.0", "method": method, "params": params, "id": 1}).encode()
    req = urllib.request.Request(RPC, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())

def call(to, fn_data):
    res = rpc("eth_call", [{"to": to, "data": fn_data, "from": MY_ADDR}, "latest"])
    return res.get("result", "0x")

def encode_addr(addr):
    return addr[2:].lower().zfill(64)

# allowance(owner, spender) = 0xdd62ed3e
def allowance(token, owner, spender):
    data = "0xdd62ed3e" + encode_addr(owner) + encode_addr(spender)
    raw = call(token, data)
    return int(raw, 16) if raw and raw != "0x" else 0

# Get WETH gToken address
raw_weth = call(GOOD_LEND, "0xd66bd524" + encode_addr(MOCK_WETH))
if raw_weth and len(raw_weth) > 66:
    GTOKEN_WETH = "0x" + raw_weth[26:66]
    print("WETH gToken:", GTOKEN_WETH)

# USDC balance of gToken
def erc20_balance(token, addr):
    data = "0x70a08231" + encode_addr(addr)
    raw = call(token, data)
    return int(raw, 16) if raw and raw != "0x" else 0

print("\n=== gToken USDC holdings ===")
usdc_in_gtoken = erc20_balance(MOCK_USDC, GTOKEN_USDC)
print(f"USDC held by gToken: {usdc_in_gtoken / 1e6:.2f}")

print("\n=== gToken allowances to pool ===")
usdc_allowance = allowance(MOCK_USDC, GTOKEN_USDC, GOOD_LEND)
print(f"USDC allowance from gToken to pool: {usdc_allowance}")

if GTOKEN_WETH:
    weth_in_gtoken = erc20_balance(MOCK_WETH, GTOKEN_WETH)
    print(f"WETH held by gToken: {weth_in_gtoken / 1e18:.4f}")
    weth_allowance = allowance(MOCK_WETH, GTOKEN_WETH, GOOD_LEND)
    print(f"WETH allowance from gToken to pool: {weth_allowance}")

print("\n=== Diagnosis ===")
if usdc_allowance == 0:
    print("BUG CONFIRMED: gToken has not approved pool to spend USDC.")
    print("GoodLendPool.borrow() calls IERC20(asset).transferFrom(gToken, borrower, amount)")
    print("But GoodLendToken never approves the pool to spend underlying tokens.")
    print("Fix: GoodLendToken constructor should approve pool for max uint256 on underlying asset,")
    print("     or GoodLendPool should call gToken.transferUnderlying() instead.")
else:
    print(f"Allowance is set: {usdc_allowance}")
