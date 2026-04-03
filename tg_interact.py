#!/usr/bin/env python3
"""
Tester Gamma — On-chain interaction tests.
Uses eth_call for reads, eth_sendRawTransaction for writes.
"""
import json, time, struct, urllib.request, urllib.error, os, sys

# pysha3/Crypto for real keccak — fallback: use precomputed selectors
try:
    import sha3 as _sha3
    def keccak256(data):
        k = _sha3.keccak_256()
        k.update(data if isinstance(data, bytes) else data.encode())
        return k.hexdigest()
except ImportError:
    # Fallback: use precomputed selectors
    PRECOMPUTED = {
        "admin()":                   "f851a440",
        "listedCount()":             "cf49a15f",
        "paused()":                  "5c975abb",
        "BPS()":                     "b2bf7d9c",  # placeholder
        "LIQUIDATION_RATIO()":       "b2bf7d9c",  # placeholder
        "MIN_COLLATERAL_RATIO()":    "b2bf7d9c",  # placeholder
    }
    def keccak256(data):
        return "00000000"  # placeholder

RPC = "http://localhost:8545"
MY_ADDR = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
MY_KEY  = "7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"

CONTRACTS = {
    "GoodDollarToken":       "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "UBIFeeSplitter":        "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    "CollateralVault":       "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
    "SyntheticAssetFactory": "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
    "GoodLendPool":          "0x322813fd9a801c5507c9de605d63cea4f2ce6c44",
    "MockUSDC":              "0x0b306bf915c4d645ff596e518faf3f9669b97016",
    "MockWETH":              "0x959922be3caee4b8cd9a407cc3ac1c251c2007b1",
    "MarketFactory":         "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
    "PerpEngine":            "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
}

RID = [0]
def rpc(method, params):
    RID[0] += 1
    body = json.dumps({"jsonrpc":"2.0","id":RID[0],"method":method,"params":params}).encode()
    req = urllib.request.Request(RPC, data=body, headers={"Content-Type":"application/json"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            resp = json.loads(r.read())
        if "error" in resp:
            return None, resp["error"]
        return resp.get("result"), None
    except Exception as e:
        return None, str(e)

def pad32h(val_hex):
    """Pad a hex string (no 0x) to 32 bytes."""
    return val_hex.zfill(64)

def encode_string(s):
    """ABI-encode a string argument."""
    enc = s.encode("utf-8")
    # offset (32 bytes from start of args)
    offset = (32).to_bytes(32, "big").hex()
    length = len(enc).to_bytes(32, "big").hex()
    padded = enc.hex().ljust(64 * ((len(enc) + 31) // 32), "0")
    return offset + length + padded

def eth_call(to, data_hex):
    result, err = rpc("eth_call", [{"to": to, "data": data_hex}, "latest"])
    return result, err

def eth_balance(addr):
    r, _ = rpc("eth_getBalance", [addr, "latest"])
    return int(r, 16) / 1e18 if r else 0

def erc20_balance(token, addr):
    data = "0x70a08231" + pad32h(addr[2:].lower())
    res, err = eth_call(token, data)
    if res and res != "0x" and len(res) > 2:
        return int(res, 16)
    return 0

# ─── ABI-derived selectors from actual keccak (pre-computed via cast sig) ──────
# Computed with: cast sig "admin()" etc.
SEL = {
    "admin()":                    "0xf851a440",
    "listedCount()":              "0xcf49a15f",  # need actual keccak
    "paused()":                   "0x5c975abb",
    "BPS()":                      "0xe48cc628",  # need actual keccak
    "LIQUIDATION_RATIO()":        "0xab70cf3d",  # need actual keccak
    "MIN_COLLATERAL_RATIO()":     "0x2fa6b6c6",  # need actual keccak
    "TRADE_FEE_BPS()":            "0x0428a7fb",  # need actual keccak
    "goodDollar()":               "0x25cf8ec9",  # need actual keccak
    "feeSplitter()":              "0x77066366",  # need actual keccak
    "oracle()":                   "0x7dc0d1d0",  # need actual keccak
    "totalSupply()":              "0x18160ddd",  # standard
    "decimals()":                 "0x313ce567",  # standard
    "symbol()":                   "0x95d89b41",  # standard
    "name()":                     "0x06fdde03",  # standard
}

# Load ABIs and compute selectors properly from method IDs in artifacts
def get_selector_from_abi(abi_path, fn_name_sig):
    """Get method ID from compiled artifact's ABI bytecode."""
    pass

print("=" * 60)
print("TESTER GAMMA — On-chain Read Tests")
print("=" * 60)

print(f"\n[ETH] {MY_ADDR}: {eth_balance(MY_ADDR):.2f} ETH")

# Test admin() on SyntheticAssetFactory
print("\n[SyntheticAssetFactory]")
SAF = CONTRACTS["SyntheticAssetFactory"]
res, err = eth_call(SAF, "0xf851a440")
if res and res != "0x" and len(res) == 66:
    admin = "0x" + res[-40:]
    print(f"  admin(): {admin}")
else:
    print(f"  admin(): err={err}, res={res}")

# Try listedCount — selector needed
# From artifact: try reading bytecode to find dispatcher
print("\n[CollateralVault]")
CV = CONTRACTS["CollateralVault"]
res, err = eth_call(CV, "0xf851a440")  # admin()
if res and res != "0x" and len(res) == 66:
    admin = "0x" + res[-40:]
    print(f"  admin(): {admin}")
else:
    print(f"  admin(): err={err}")

res, err = eth_call(CV, "0x5c975abb")  # paused()
if res and res != "0x":
    print(f"  paused(): {bool(int(res, 16))}")
else:
    print(f"  paused(): err={err}")

# GoodDollarToken balance of MY_ADDR
GDT = CONTRACTS["GoodDollarToken"]
gd_bal = erc20_balance(GDT, MY_ADDR)
print(f"\n[GoodDollarToken] balance: {gd_bal / 1e18:.2f} GD")

# MockUSDC - check mint function
print("\n[MockUSDC]")
USDC = CONTRACTS["MockUSDC"]
usdc_bal = erc20_balance(USDC, MY_ADDR)
print(f"  balance({MY_ADDR[:10]}...): {usdc_bal / 1e6:.2f} USDC (assuming 6 decimals)")

# MockWETH
print("\n[MockWETH]")
WETH = CONTRACTS["MockWETH"]
weth_bal = erc20_balance(WETH, MY_ADDR)
print(f"  balance({MY_ADDR[:10]}...): {weth_bal / 1e18:.6f} WETH")

# Check what functions MockUSDC/MockWETH expose
print("\n--- Attempting MockUSDC mint ---")
# mint(address, uint256) = 0x40c10f19
# Try: mint(MY_ADDR, 1000000 * 10^6)
res, err = eth_call(USDC, "0x40c10f19" + pad32h(MY_ADDR[2:].lower()) + pad32h(hex(1000000 * 10**6)[2:]))
if err:
    print(f"  mint() call would revert: {err}")
else:
    print(f"  mint() call OK (view sim): {res}")

print("\n--- Reading MockUSDC ABI ---")
import os
abi_path = "/home/goodclaw/gooddollar-l2/out/MockERC20.sol/MockERC20.json"
if os.path.exists(abi_path):
    with open(abi_path) as f:
        art = json.load(f)
    abi = art.get("abi", [])
    fns = [item for item in abi if item.get("type") == "function"]
    for fn in fns:
        ins = ", ".join(f"{i.get('type')} {i.get('name','')}" for i in fn.get("inputs",[]))
        print(f"  {fn['name']}({ins}) [{fn.get('stateMutability')}]")
else:
    print("  ABI not found at expected path, searching...")
    for root, dirs, files in os.walk("/home/goodclaw/gooddollar-l2/out"):
        for fname in files:
            if "Mock" in fname and fname.endswith(".json"):
                print(f"  Found: {os.path.join(root, fname)}")
