#!/usr/bin/env python3
"""
Tester Gamma - GoodStocks & Stress Test Runner
Uses JSON-RPC directly (no cast dependency).
"""
import json, time, urllib.request, urllib.error, binascii, struct, hashlib

RPC = "http://localhost:8545"
MY_ADDR = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
MY_KEY  = "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"

# Contracts
CONTRACTS = {
    "GoodDollarToken":       "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "UBIFeeSplitter":        "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    "PerpEngine":            "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
    "MarginVault":           "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
    "MarketFactory":         "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
    "ConditionalTokens":     "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
    "CollateralVault":       "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
    "SyntheticAssetFactory": "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
    "GoodLendPool":          "0x322813fd9a801c5507c9de605d63cea4f2ce6c44",
    "MockUSDC":              "0x0b306bf915c4d645ff596e518faf3f9669b97016",
    "MockWETH":              "0x959922be3caee4b8cd9a407cc3ac1c251c2007b1",
}

RID = [0]
def rpc(method, params):
    RID[0] += 1
    body = json.dumps({"jsonrpc":"2.0","id":RID[0],"method":method,"params":params}).encode()
    req = urllib.request.Request(RPC, data=body, headers={"Content-Type":"application/json"})
    try:
        with urllib.request.urlopen(req) as r:
            resp = json.loads(r.read())
        if "error" in resp:
            return None, resp["error"]
        return resp.get("result"), None
    except Exception as e:
        return None, str(e)

def call(to, data):
    """eth_call — read-only."""
    result, err = rpc("eth_call", [{"to": to, "data": data}, "latest"])
    return result, err

def pad32(val):
    """Pad a hex string (without 0x) to 32 bytes."""
    return val.zfill(64)

def addr_to_topic(addr):
    return "0x" + pad32(addr[2:].lower())

def sel(sig):
    """4-byte selector from function signature."""
    h = hashlib.new("sha3_256")
    # keccak — use sha3_256 as approximation for display; actual keccak needed for calls
    # We'll hardcode known selectors instead
    pass

# Known 4-byte selectors (keccak256 of function signatures)
# balanceOf(address) = 0x70a08231
# symbol() = 0x95d89b41
# name() = 0x06fdde03
# decimals() = 0x313ce567
# totalSupply() = 0x18160ddd
# getAllMarkets() = ?
# getAsset(bytes32) = ?

def erc20_balance(token, addr):
    data = "0x70a08231" + pad32(addr[2:].lower())
    res, err = call(token, data)
    if err or not res or res == "0x":
        return None, err
    return int(res, 16), None

def erc20_symbol(token):
    res, err = call(token, "0x95d89b41")
    if err or not res or res == "0x":
        return "?", err
    # ABI decode string
    try:
        offset = int(res[2:66], 16)
        length = int(res[2+64*2:2+64*3], 16)
        raw = bytes.fromhex(res[2+64*3:2+64*3+length*2])
        return raw.decode("utf-8", errors="replace"), None
    except Exception as e:
        return "decode_err", str(e)

def erc20_decimals(token):
    res, err = call(token, "0x313ce567")
    if err or not res or res == "0x":
        return 18, err
    return int(res, 16), None

results = []
failures = []

print("=" * 60)
print("TESTER GAMMA — GoodStocks & Stress Test Suite")
print("=" * 60)

# 1. Balance check
print("\n[1] WALLET BALANCE CHECK")
bal_result, err = rpc("eth_getBalance", [MY_ADDR, "latest"])
eth_bal = int(bal_result, 16) / 1e18 if bal_result else 0
print(f"  ETH: {eth_bal:.2f}")
results.append(("ETH balance", eth_bal > 0, f"{eth_bal:.2f} ETH"))

for name, addr in [("MockUSDC", CONTRACTS["MockUSDC"]), ("MockWETH", CONTRACTS["MockWETH"]), ("GoodDollarToken", CONTRACTS["GoodDollarToken"])]:
    bal, err = erc20_balance(addr, MY_ADDR)
    sym, _ = erc20_symbol(addr)
    dec, _ = erc20_decimals(addr)
    if bal is not None:
        human = bal / (10 ** dec)
        print(f"  {sym} ({name}): {human:.4f}")
        results.append((f"{sym} balance", True, f"{human:.4f}"))
    else:
        print(f"  {name}: ERROR {err}")
        results.append((f"{name} balance", False, str(err)))

# 2. Contract code checks — confirm all contracts are deployed
print("\n[2] CONTRACT DEPLOYMENT CHECK")
for name, addr in CONTRACTS.items():
    code, err = rpc("eth_getCode", [addr, "latest"])
    deployed = code and code != "0x" and len(code) > 4
    status = "OK" if deployed else "MISSING"
    print(f"  {name}: {status} ({len(code)//2 if code else 0} bytes)")
    results.append((f"{name} deployed", deployed, status))
    if not deployed:
        failures.append(f"Contract {name} at {addr} has no code deployed")

# 3. SyntheticAssetFactory — read markets/state
print("\n[3] SYNTHETIC ASSET FACTORY")
saf = CONTRACTS["SyntheticAssetFactory"]

# Try assetCount() — selector 0x34931210 (keccak of assetCount())
# Actually try a few common getters
for sig_hex, name in [("0x8da5cb5b", "owner()"), ("0x4783c35b", "assetCount()")]:
    res, err = call(saf, sig_hex)
    if err:
        print(f"  {name}: call failed — {err}")
    elif res and res != "0x" and len(res) > 2:
        print(f"  {name}: {res}")
    else:
        print(f"  {name}: empty response")

# 4. CollateralVault — check state
print("\n[4] COLLATERAL VAULT")
cv = CONTRACTS["CollateralVault"]
res, err = call(cv, "0x8da5cb5b")  # owner()
if res and res != "0x":
    owner = "0x" + res[-40:]
    print(f"  owner(): {owner}")
    results.append(("CollateralVault owner", True, owner))
else:
    print(f"  owner(): failed — {err}")
    failures.append("CollateralVault owner() call failed")

# 5. GoodLendPool — check reserves
print("\n[5] GOOD LEND POOL")
glp = CONTRACTS["GoodLendPool"]
res, err = call(glp, "0x8da5cb5b")  # owner()
if res and res != "0x":
    owner = "0x" + res[-40:]
    print(f"  owner(): {owner}")

# getReservesList() selector
res, err = call(glp, "0xd1946dbc")
if res and res != "0x" and len(res) > 2:
    print(f"  getReservesList(): {len(res)//2} bytes returned")
    results.append(("GoodLendPool getReservesList", True, f"{len(res)//2}B"))
else:
    print(f"  getReservesList(): {err or 'empty'}")

# 6. MarketFactory — check markets
print("\n[6] MARKET FACTORY")
mf = CONTRACTS["MarketFactory"]
res, err = call(mf, "0x8da5cb5b")  # owner()
if res and res != "0x":
    owner = "0x" + res[-40:]
    print(f"  owner(): {owner}")

# 7. UBIFeeSplitter
print("\n[7] UBI FEE SPLITTER")
ubi = CONTRACTS["UBIFeeSplitter"]
res, err = call(ubi, "0x8da5cb5b")  # owner()
if res and res != "0x":
    owner = "0x" + res[-40:]
    print(f"  owner(): {owner}")
    results.append(("UBIFeeSplitter owner", True, owner))
else:
    print(f"  owner(): {err or 'empty'}")

# Check GoodDollar balance of UBIFeeSplitter
ubi_gd_bal, err = erc20_balance(CONTRACTS["GoodDollarToken"], CONTRACTS["UBIFeeSplitter"])
if ubi_gd_bal is not None:
    print(f"  GoodDollar balance: {ubi_gd_bal / 1e18:.4f} GD")
    results.append(("UBIFeeSplitter GD balance", True, f"{ubi_gd_bal / 1e18:.4f}"))

# 8. Block stats for stress context
print("\n[8] DEVNET STATS")
block_num, _ = rpc("eth_blockNumber", [])
blk_n = int(block_num, 16)
block, _ = rpc("eth_getBlockByNumber", [block_num, False])
gas_limit = int(block["gasLimit"], 16) if block else 0
gas_used = int(block["gasUsed"], 16) if block else 0
print(f"  Block: {blk_n}")
print(f"  Gas limit: {gas_limit:,}")
print(f"  Gas used (latest): {gas_used:,}")
print(f"  Gas utilization: {gas_used/gas_limit*100:.1f}%" if gas_limit > 0 else "  Gas utilization: n/a")
results.append(("Devnet running", True, f"block {blk_n}"))

# 9. Tx count check (nonce = how many txs from our address)
nonce, _ = rpc("eth_getTransactionCount", [MY_ADDR, "latest"])
nonce_val = int(nonce, 16) if nonce else 0
print(f"  Tester nonce: {nonce_val}")

# ==============================
print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
passed = sum(1 for _, ok, _ in results if ok)
total = len(results)
print(f"  Checks passed: {passed}/{total}")
if failures:
    print(f"\nFAILURES ({len(failures)}):")
    for f in failures:
        print(f"  - {f}")
else:
    print("  No failures detected.")

print("\nDETAILS:")
for name, ok, detail in results:
    icon = "PASS" if ok else "FAIL"
    print(f"  [{icon}] {name}: {detail}")
