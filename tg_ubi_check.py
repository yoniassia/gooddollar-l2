#!/usr/bin/env python3
"""Check UBIFeeSplitter stats and GoodDollarToken fee routing."""
import json, urllib.request

RPC = "http://localhost:8545"

CONTRACTS = {
    "GoodDollarToken": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "UBIFeeSplitter":  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    "CollateralVault": "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
    "AAPL_ADDR":       "0x6f1216d1bfe15c98520ca1434fc1d9d57ac95321",
}
ADMIN  = "0xf39Fd6e51aad88F6f4ce6aB8827279cffFb92266"
MY     = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"

RID = [0]
def rpc(method, params):
    RID[0] += 1
    body = json.dumps({"jsonrpc":"2.0","id":RID[0],"method":method,"params":params}).encode()
    req = urllib.request.Request(RPC, data=body, headers={"Content-Type":"application/json"})
    with urllib.request.urlopen(req) as r:
        resp = json.loads(r.read())
    return resp.get("result"), resp.get("error")

def eth_call(to, data):
    r, e = rpc("eth_call", [{"to": to, "data": data}, "latest"])
    return r, e

def read_uint(contract, sel4):
    r, _ = eth_call(contract, "0x" + sel4)
    return int(r, 16) if r and r != "0x" else 0

def erc20_bal(token, addr):
    r, _ = eth_call(token, "0x70a08231" + addr[2:].lower().zfill(64))
    return int(r, 16) if r and r != "0x" else 0

print("=" * 60)
print("UBI FEE SYSTEM AUDIT")
print("=" * 60)

# UBIFeeSplitter stats - from artifact
# Get selectors
import os, json as _json
with open("/home/goodclaw/gooddollar-l2/out/UBIFeeSplitter.sol/UBIFeeSplitter.json") as f:
    art = _json.load(f)
methods = art.get("methodIdentifiers", {})
print("\nUBIFeeSplitter selectors:")
for sig, sel in sorted(methods.items()):
    print(f"  0x{sel}  {sig}")

print("\n--- UBIFeeSplitter state ---")
for sig, sel in methods.items():
    if any(x in sig for x in ["total", "ubi", "protocol", "admin", "claimable"]):
        r, e = eth_call(CONTRACTS["UBIFeeSplitter"], "0x" + sel)
        if r and r != "0x" and len(r) > 2:
            val = int(r, 16)
            if "total" in sig or "Balance" in sig:
                print(f"  {sig}: {val / 1e18:.6f} GD ({val})")
            elif "BPS" in sig or "bps" in sig:
                print(f"  {sig}: {val} bps ({val/100:.2f}%)")
            elif "address" in sig.lower() or val < 2**160:
                # Likely an address if it fits in 20 bytes cleanly
                if val < 2**160:
                    addr = "0x" + r[-40:]
                    print(f"  {sig}: {addr}")
                else:
                    print(f"  {sig}: {val}")

print("\n--- Token balances at key addresses ---")
GDT = CONTRACTS["GoodDollarToken"]
for label, addr in [
    ("Tester Gamma", MY),
    ("Admin/Deployer", ADMIN),
    ("UBIFeeSplitter", CONTRACTS["UBIFeeSplitter"]),
    ("CollateralVault", CONTRACTS["CollateralVault"]),
]:
    bal = erc20_bal(GDT, addr)
    print(f"  GD @ {label}: {bal/1e18:.4f}")

print("\n--- GoodDollarToken methods (checking fundUBIPool) ---")
with open("/home/goodclaw/gooddollar-l2/out/GoodDollarToken.sol/GoodDollarToken.json") as f:
    gdt_art = _json.load(f)
gdt_methods = gdt_art.get("methodIdentifiers", {})
for sig, sel in sorted(gdt_methods.items()):
    print(f"  0x{sel}  {sig}")

print("\n--- GoodDollarToken state ---")
for sig, sel in gdt_methods.items():
    if any(x in sig.lower() for x in ["name(", "symbol(", "decimals(", "totalsupply", "ubipool", "ubireserve"]):
        r, e = eth_call(GDT, "0x" + sel)
        if r and r != "0x" and len(r) > 2:
            val_raw = r
            try:
                if sig == "name()" or sig == "symbol()":
                    # decode string
                    offset = int(r[2:66], 16)
                    length = int(r[2+64:2+128], 16)
                    raw = bytes.fromhex(r[2+128:2+128+length*2])
                    print(f"  {sig}: {raw.decode()}")
                else:
                    val = int(r, 16)
                    print(f"  {sig}: {val} ({val/1e18:.4f} if 18dec)")
            except:
                print(f"  {sig}: {r[:66]}...")
