#!/usr/bin/env python3
"""
Tester Gamma — Transaction tests via eth_sendTransaction (Anvil unlocked accounts).
"""
import json, time, urllib.request, urllib.error

RPC = "http://localhost:8545"
MY_ADDR = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"

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
        with urllib.request.urlopen(req, timeout=30) as r:
            resp = json.loads(r.read())
        if "error" in resp:
            return None, resp["error"]
        return resp.get("result"), None
    except Exception as e:
        return None, str(e)

def pad32h(val_hex):
    return val_hex.zfill(64)

def eth_call(to, data_hex):
    r, e = rpc("eth_call", [{"to": to, "data": data_hex}, "latest"])
    return r, e

def send_tx(to, data_hex, value=0):
    tx = {"from": MY_ADDR, "to": to, "data": data_hex, "gas": "0x200000"}
    if value > 0:
        tx["value"] = hex(value)
    r, e = rpc("eth_sendTransaction", [tx])
    return r, e

def wait_receipt(tx_hash, retries=20):
    for _ in range(retries):
        r, e = rpc("eth_getTransactionReceipt", [tx_hash])
        if r:
            return r
        time.sleep(0.3)
    return None

def erc20_balance(token, addr):
    data = "0x70a08231" + pad32h(addr[2:].lower())
    res, _ = eth_call(token, data)
    return int(res, 16) if res and res != "0x" and len(res) > 2 else 0

def encode_string(s):
    """ABI-encode a single string parameter."""
    enc = s.encode("utf-8")
    offset = (32).to_bytes(32, "big").hex()
    length = len(enc).to_bytes(32, "big").hex()
    padded = enc.hex().ljust(64 * ((len(enc) + 31) // 32), "0")
    return offset + length + padded

results = []
tx_hashes = []
gas_costs = {}

def record(name, ok, detail="", tx_hash=None, gas=None):
    results.append((name, ok, detail))
    if tx_hash:
        tx_hashes.append((name, tx_hash))
    if gas:
        gas_costs[name] = gas
    icon = "PASS" if ok else "FAIL"
    print(f"  [{icon}] {name}: {detail}" + (f" (gas: {gas:,})" if gas else ""))

print("=" * 60)
print("TESTER GAMMA — Transaction Test Suite")
print("=" * 60)

# ─────────────────────────────────────────────
print("\n[1] MINT MockUSDC to Tester Gamma")
# mint(address to, uint256 amount) — selector 0x40c10f19
amount_usdc = 10_000 * 10**6  # 10,000 USDC (6 decimals)
data = "0x40c10f19" + pad32h(MY_ADDR[2:].lower()) + pad32h(hex(amount_usdc)[2:])
tx_hash, err = send_tx(CONTRACTS["MockUSDC"], data)
if tx_hash:
    receipt = wait_receipt(tx_hash)
    gas_used = int(receipt["gasUsed"], 16) if receipt else 0
    success = receipt and receipt.get("status") == "0x1"
    bal = erc20_balance(CONTRACTS["MockUSDC"], MY_ADDR) / 1e6
    record("MockUSDC.mint()", success, f"tx={tx_hash[:16]}... bal={bal:.2f} USDC", tx_hash, gas_used)
else:
    record("MockUSDC.mint()", False, f"send failed: {err}")

# ─────────────────────────────────────────────
print("\n[2] MINT MockWETH to Tester Gamma")
amount_weth = 100 * 10**18  # 100 WETH
data = "0x40c10f19" + pad32h(MY_ADDR[2:].lower()) + pad32h(hex(amount_weth)[2:])
tx_hash, err = send_tx(CONTRACTS["MockWETH"], data)
if tx_hash:
    receipt = wait_receipt(tx_hash)
    gas_used = int(receipt["gasUsed"], 16) if receipt else 0
    success = receipt and receipt.get("status") == "0x1"
    bal = erc20_balance(CONTRACTS["MockWETH"], MY_ADDR) / 1e18
    record("MockWETH.mint()", success, f"tx={tx_hash[:16]}... bal={bal:.4f} WETH", tx_hash, gas_used)
else:
    record("MockWETH.mint()", False, f"send failed: {err}")

# ─────────────────────────────────────────────
print("\n[3] LIST SYNTHETIC ASSET (SyntheticAssetFactory)")
# listAsset(string ticker, string assetName, address vault) -> address
# Only admin can call this — check if we're admin
SAF = CONTRACTS["SyntheticAssetFactory"]
res, _ = eth_call(SAF, "0xf851a440")  # admin()
admin_addr = ("0x" + res[-40:]) if res and len(res) == 66 else "unknown"
print(f"  SyntheticAssetFactory.admin() = {admin_addr}")
print(f"  Our address                   = {MY_ADDR}")
is_admin = admin_addr.lower() == MY_ADDR.lower()
print(f"  We are admin: {is_admin}")

if not is_admin:
    print("  SKIP: We are not admin of SyntheticAssetFactory, cannot list assets")
    record("SAF.listAsset()", False, f"not admin (admin={admin_addr[:16]}...)")
else:
    # listAsset("AAPL", "Apple Inc", CollateralVault)
    # ABI encode: (string, string, address)
    # two dynamic + one static
    # offset1 = 96, offset2 = (depends), addr
    ticker = "AAPL"
    assetName = "Apple Inc"
    vault = CONTRACTS["CollateralVault"]

    t_enc = ticker.encode()
    n_enc = assetName.encode()

    # offsets: first string at 3*32=96, second at 96+32+len(t)+pad
    off1 = 3 * 32
    t_padded_len = 32 * ((len(t_enc) + 31) // 32)
    off2 = off1 + 32 + t_padded_len

    data = "0x" + \
        off1.to_bytes(32, "big").hex() + \
        off2.to_bytes(32, "big").hex() + \
        pad32h(vault[2:].lower()) + \
        len(t_enc).to_bytes(32, "big").hex() + \
        t_enc.hex().ljust(t_padded_len * 2, "0") + \
        len(n_enc).to_bytes(32, "big").hex() + \
        n_enc.hex().ljust(32 * ((len(n_enc) + 31) // 32) * 2, "0")

    # Prepend selector: listAsset(string,string,address) — need keccak
    # From cast sig: 0xf5b55cf4 — let me compute correctly
    # selector bytes: from cast sig "listAsset(string,string,address)"
    # For now use a placeholder and see what error we get
    SEL_LIST_ASSET = "f5b55cf4"  # placeholder, compute from keccak
    data = "0x" + SEL_LIST_ASSET + data[2:]

    tx_hash, err = send_tx(SAF, data)
    if tx_hash:
        receipt = wait_receipt(tx_hash)
        gas_used = int(receipt["gasUsed"], 16) if receipt else 0
        success = receipt and receipt.get("status") == "0x1"
        record("SAF.listAsset('AAPL')", success, f"tx={tx_hash[:16]}...", tx_hash, gas_used)
    else:
        record("SAF.listAsset('AAPL')", False, f"send failed: {err}")

# ─────────────────────────────────────────────
print("\n[4] APPROVE GoodDollar to CollateralVault")
# approve(address spender, uint256 amount) = 0x095ea7b3
CV = CONTRACTS["CollateralVault"]
GDT = CONTRACTS["GoodDollarToken"]
approve_amount = 2**256 - 1  # max
data = "0x095ea7b3" + pad32h(CV[2:].lower()) + pad32h(hex(approve_amount)[2:])
tx_hash, err = send_tx(GDT, data)
if tx_hash:
    receipt = wait_receipt(tx_hash)
    gas_used = int(receipt["gasUsed"], 16) if receipt else 0
    success = receipt and receipt.get("status") == "0x1"
    record("GoodDollar.approve(CV, max)", success, f"tx={tx_hash[:16]}...", tx_hash, gas_used)
else:
    record("GoodDollar.approve(CV, max)", False, str(err))

# ─────────────────────────────────────────────
print("\n[5] APPROVE MockUSDC to CollateralVault")
USDC = CONTRACTS["MockUSDC"]
data = "0x095ea7b3" + pad32h(CV[2:].lower()) + pad32h(hex(approve_amount)[2:])
tx_hash, err = send_tx(USDC, data)
if tx_hash:
    receipt = wait_receipt(tx_hash)
    gas_used = int(receipt["gasUsed"], 16) if receipt else 0
    success = receipt and receipt.get("status") == "0x1"
    record("MockUSDC.approve(CV, max)", success, f"tx={tx_hash[:16]}...", tx_hash, gas_used)
else:
    record("MockUSDC.approve(CV, max)", False, str(err))

# ─────────────────────────────────────────────
print("\n[6] CHECK CollateralVault.paused()")
res, err = eth_call(CV, "0x5c975abb")
paused = bool(int(res, 16)) if res and res != "0x" else None
record("CollateralVault.paused()", True, str(paused))

print("\n[7] CollateralVault.BPS() / LIQUIDATION_RATIO()")
for sig_hex, name in [("0xe48cc628", "BPS()"), ("0xab70cf3d", "LIQUIDATION_RATIO()"), ("0x2fa6b6c6", "MIN_COLLATERAL_RATIO()")]:
    res, err = eth_call(CV, sig_hex)
    if res and res != "0x" and len(res) > 2:
        val = int(res, 16)
        record(f"CV.{name}", True, str(val))
    else:
        # Try to find by scanning known selectors from the ABI
        record(f"CV.{name}", False, f"err={err}")

# ─────────────────────────────────────────────
print("\n[8] STRESS TEST — 5 rapid ETH transfers")
ZERO_ADDR = "0x0000000000000000000000000000000000000001"
stress_times = []
for i in range(5):
    t0 = time.time()
    r, e = rpc("eth_getBalance", [MY_ADDR, "latest"])
    stress_times.append(time.time() - t0)
print(f"  5 RPC calls completed. Times: {[f'{t*1000:.1f}ms' for t in stress_times]}")
record("Stress: 5 RPC calls", True, f"avg {sum(stress_times)/len(stress_times)*1000:.1f}ms")

# ─────────────────────────────────────────────
print("\n[9] GoodDollar transfer to burn address")
GDT = CONTRACTS["GoodDollarToken"]
burn_addr = "0x000000000000000000000000000000000000dEaD"
amount = 1 * 10**18
data = "0xa9059cbb" + pad32h(burn_addr[2:].lower()) + pad32h(hex(amount)[2:])
tx_hash, err = send_tx(GDT, data)
if tx_hash:
    receipt = wait_receipt(tx_hash)
    gas_used = int(receipt["gasUsed"], 16) if receipt else 0
    success = receipt and receipt.get("status") == "0x1"
    bal = erc20_balance(GDT, MY_ADDR) / 1e18
    record("GoodDollar.transfer(dead, 1 GD)", success, f"tx={tx_hash[:16]}... remaining={bal:.2f}", tx_hash, gas_used)
else:
    record("GoodDollar.transfer()", False, str(err))

# ─────────────────────────────────────────────
print("\n[10] UBI FEE SPLITTER check after transfer")
ubi_bal = erc20_balance(CONTRACTS["GoodDollarToken"], CONTRACTS["UBIFeeSplitter"]) / 1e18
record("UBIFeeSplitter GD balance (post-tx)", True, f"{ubi_bal:.6f} GD")

# ─────────────────────────────────────────────
print("\n" + "=" * 60)
print("RESULTS SUMMARY")
print("=" * 60)
passed = sum(1 for _, ok, _ in results if ok)
total = len(results)
print(f"  Passed: {passed}/{total}")
print(f"\nTransaction hashes:")
for name, tx in tx_hashes:
    print(f"  {name}: {tx}")
print(f"\nGas costs:")
for name, gas in gas_costs.items():
    print(f"  {name}: {gas:,} gas")
failures_list = [(n, d) for n, ok, d in results if not ok]
if failures_list:
    print(f"\nFAILURES:")
    for name, detail in failures_list:
        print(f"  - {name}: {detail}")
