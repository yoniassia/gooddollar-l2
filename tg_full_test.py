#!/usr/bin/env python3
"""
Tester Gamma — Full GoodStocks + Stress Test
Uses Anvil auto-unlocked accounts for admin operations.
"""
import json, time, urllib.request, urllib.error

RPC     = "http://localhost:8545"
MY_ADDR  = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
ADMIN    = "0xf39Fd6e51aad88F6f4ce6aB8827279cffFb92266"  # Anvil #0 / deployer

C = {
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

# ABI selectors from artifacts
SEL = {
    "admin()":                       "f851a440",
    "paused()":                      "5c975abb",
    "BPS()":                         "249d39e9",
    "LIQUIDATION_RATIO()":           "c4323fea",
    "MIN_COLLATERAL_RATIO()":        "7a9fffb7",
    "TRADE_FEE_BPS()":               "9185f598",
    "LIQUIDATION_BONUS_BPS()":       "ecd1dae6",
    "feeSplitter()":                 "6052970c",
    "goodDollar()":                  "119e5bf3",
    "oracle()":                      "7dc0d1d0",
    "listedCount()":                 "f36065b3",
    "listedKeys(uint256)":           "ccceb569",
    "getAsset(string)":              "cd5286d0",
    "listAsset(string,string,address)": "9b7fd154",
    "registerAsset(string,address)": "8c2261ad",
    "depositCollateral(string,uint256)": "c63e3835",
    "mint(string,uint256)":          "056b01ce",
    "burn(string,uint256)":          "b48272cc",
    "getPosition(address,string)":   "b1ad0fa0",
    "getCollateralRatio(address,string)": "6dc827d9",
    "withdrawCollateral(string,uint256)": "1ce96712",
    "liquidate(address,string)":     "1f33a888",
    "balanceOf(address)":            "70a08231",
    "approve(address,uint256)":      "095ea7b3",
    "transfer(address,uint256)":     "a9059cbb",
    "mint(address,uint256)":         "40c10f19",
    "getReservesCount()":            "72218d04",
    "getUserAccountData(address)":   "bf92857c",
    "supply(address,uint256)":       "f2b9fdb8",
    "borrow(address,uint256)":       "4b8a3529",
    "marketCount()":                 "ec979082",
    "openPosition(uint256,uint256,bool,uint256)": "3dc8f144",
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

def h(v):
    """int to 32-byte hex."""
    return pad32h(hex(v)[2:])

def eth_call(to, data_hex):
    r, e = rpc("eth_call", [{"to": to, "data": data_hex}, "latest"])
    return r, e

def send_tx(frm, to, data_hex, gas=500000):
    tx = {"from": frm, "to": to, "data": data_hex, "gas": hex(gas)}
    r, e = rpc("eth_sendTransaction", [tx])
    return r, e

def wait_receipt(tx_hash, retries=30):
    for _ in range(retries):
        r, e = rpc("eth_getTransactionReceipt", [tx_hash])
        if r:
            return r
        time.sleep(0.3)
    return None

def erc20_bal(token, addr):
    data = "0x" + SEL["balanceOf(address)"] + pad32h(addr[2:].lower())
    res, _ = eth_call(token, data)
    return int(res, 16) if res and res != "0x" and len(res) > 2 else 0

def view(to, sel_name, *args):
    data = "0x" + SEL[sel_name]
    for a in args:
        if isinstance(a, str) and a.startswith("0x"):
            data += pad32h(a[2:].lower())
        elif isinstance(a, int):
            data += h(a)
    res, err = eth_call(to, data)
    return res, err

def encode_string(s):
    enc = s.encode("utf-8")
    offset = (32).to_bytes(32, "big").hex()
    length = len(enc).to_bytes(32, "big").hex()
    padded = enc.hex().ljust(64 * ((len(enc) + 31) // 32), "0")
    return offset + length + padded

def encode_str_str_addr(s1, s2, addr):
    """ABI encode (string, string, address)."""
    s1e = s1.encode()
    s2e = s2.encode()
    s1_padded_len = 32 * ((len(s1e) + 31) // 32)
    s2_padded_len = 32 * ((len(s2e) + 31) // 32)
    off1 = 3 * 32
    off2 = off1 + 32 + s1_padded_len
    return (
        off1.to_bytes(32, "big").hex() +
        off2.to_bytes(32, "big").hex() +
        pad32h(addr[2:].lower()) +
        len(s1e).to_bytes(32, "big").hex() +
        s1e.hex().ljust(s1_padded_len * 2, "0") +
        len(s2e).to_bytes(32, "big").hex() +
        s2e.hex().ljust(s2_padded_len * 2, "0")
    )

def encode_str_addr(s, addr):
    """ABI encode (string, address)."""
    se = s.encode()
    s_padded_len = 32 * ((len(se) + 31) // 32)
    off1 = 2 * 32
    return (
        off1.to_bytes(32, "big").hex() +
        pad32h(addr[2:].lower()) +
        len(se).to_bytes(32, "big").hex() +
        se.hex().ljust(s_padded_len * 2, "0")
    )

def encode_str_uint(s, amount):
    """ABI encode (string, uint256)."""
    se = s.encode()
    s_padded_len = 32 * ((len(se) + 31) // 32)
    off1 = 2 * 32
    return (
        off1.to_bytes(32, "big").hex() +
        h(amount) +
        len(se).to_bytes(32, "big").hex() +
        se.hex().ljust(s_padded_len * 2, "0")
    )

def encode_addr_str(addr, s):
    """ABI encode (address, string)."""
    se = s.encode()
    s_padded_len = 32 * ((len(se) + 31) // 32)
    off2 = 2 * 32
    return (
        pad32h(addr[2:].lower()) +
        off2.to_bytes(32, "big").hex() +
        len(se).to_bytes(32, "big").hex() +
        se.hex().ljust(s_padded_len * 2, "0")
    )

results = []
tx_hashes = []
gas_costs = {}
failures = []

def record(name, ok, detail="", tx_hash=None, gas=None):
    results.append((name, ok, detail))
    if tx_hash:
        tx_hashes.append((name, tx_hash))
    if gas is not None:
        gas_costs[name] = gas
    icon = "PASS" if ok else "FAIL"
    g = f" [gas:{gas:,}]" if gas else ""
    print(f"  [{icon}] {name}: {detail}{g}")
    if not ok:
        failures.append((name, detail))

print("=" * 60)
print("TESTER GAMMA — Full GoodStocks + Stress Test")
print("=" * 60)

# ─────────────────────────────────────────────────────────────
print("\n[1] READ CollateralVault constants")
for sel_name in ["BPS()", "LIQUIDATION_RATIO()", "MIN_COLLATERAL_RATIO()", "TRADE_FEE_BPS()", "LIQUIDATION_BONUS_BPS()"]:
    res, err = view(C["CollateralVault"], sel_name)
    if res and res != "0x" and len(res) > 2:
        val = int(res, 16)
        record(f"CV.{sel_name}", True, str(val))
    else:
        record(f"CV.{sel_name}", False, f"err={err}")

print("\n[2] READ CollateralVault config addresses")
for sel_name in ["goodDollar()", "feeSplitter()", "oracle()"]:
    res, err = view(C["CollateralVault"], sel_name)
    if res and res != "0x" and len(res) == 66:
        addr = "0x" + res[-40:]
        record(f"CV.{sel_name}", True, addr)
    else:
        record(f"CV.{sel_name}", False, f"err={err}")

print("\n[3] READ SyntheticAssetFactory state")
res, _ = view(C["SyntheticAssetFactory"], "listedCount()")
count = int(res, 16) if res and res != "0x" else 0
record("SAF.listedCount()", True, str(count))

# ─────────────────────────────────────────────────────────────
print("\n[4] ADMIN: List AAPL synthetic asset (as deployer)")
# listAsset(string ticker, string assetName, address vault)
args = encode_str_str_addr("AAPL", "Apple Inc Synthetic", C["CollateralVault"])
data = "0x" + SEL["listAsset(string,string,address)"] + args
tx_hash, err = send_tx(ADMIN, C["SyntheticAssetFactory"], data)
aapl_addr = None
if tx_hash:
    receipt = wait_receipt(tx_hash)
    gas = int(receipt["gasUsed"], 16) if receipt else 0
    success = receipt and receipt.get("status") == "0x1"
    if success:
        # Get the AAPL asset address
        enc_str = encode_string("AAPL")
        res, _ = eth_call(C["SyntheticAssetFactory"], "0x" + SEL["getAsset(string)"] + enc_str)
        aapl_addr = ("0x" + res[-40:]) if res and len(res) >= 42 else "unknown"
        record("SAF.listAsset('AAPL')", True, f"asset={aapl_addr}", tx_hash, gas)
    else:
        record("SAF.listAsset('AAPL')", False, f"tx reverted: {tx_hash}", tx_hash, gas)
else:
    record("SAF.listAsset('AAPL')", False, f"send failed: {err}")

# ─────────────────────────────────────────────────────────────
print("\n[5] ADMIN: Register AAPL in CollateralVault")
if aapl_addr and aapl_addr != "unknown":
    args = encode_str_addr("AAPL", aapl_addr)
    data = "0x" + SEL["registerAsset(string,address)"] + args
    tx_hash, err = send_tx(ADMIN, C["CollateralVault"], data)
    if tx_hash:
        receipt = wait_receipt(tx_hash)
        gas = int(receipt["gasUsed"], 16) if receipt else 0
        success = receipt and receipt.get("status") == "0x1"
        record("CV.registerAsset('AAPL')", success, f"synthetic={aapl_addr[:16]}...", tx_hash, gas)
    else:
        record("CV.registerAsset('AAPL')", False, f"send failed: {err}")
else:
    record("CV.registerAsset('AAPL')", False, "skipped - no aapl_addr")

# ─────────────────────────────────────────────────────────────
print("\n[6] APPROVE GoodDollar to CollateralVault (if not already)")
max_uint = 2**256 - 1
data = "0x" + SEL["approve(address,uint256)"] + pad32h(C["CollateralVault"][2:].lower()) + h(max_uint)
tx_hash, err = send_tx(MY_ADDR, C["GoodDollarToken"], data)
if tx_hash:
    receipt = wait_receipt(tx_hash)
    gas = int(receipt["gasUsed"], 16) if receipt else 0
    success = receipt and receipt.get("status") == "0x1"
    record("GDT.approve(CV, max)", success, "", tx_hash, gas)
else:
    record("GDT.approve(CV, max)", False, str(err))

# ─────────────────────────────────────────────────────────────
print("\n[7] DEPOSIT COLLATERAL (GoodDollar) to CollateralVault")
gd_balance = erc20_bal(C["GoodDollarToken"], MY_ADDR)
deposit_amount = 100_000 * 10**18  # 100,000 GD
print(f"  GD balance: {gd_balance / 1e18:.2f}")
print(f"  Depositing: {deposit_amount / 1e18:.2f} GD")

args = encode_str_uint("AAPL", deposit_amount)
data = "0x" + SEL["depositCollateral(string,uint256)"] + args
tx_hash, err = send_tx(MY_ADDR, C["CollateralVault"], data)
if tx_hash:
    receipt = wait_receipt(tx_hash)
    gas = int(receipt["gasUsed"], 16) if receipt else 0
    success = receipt and receipt.get("status") == "0x1"
    if not success:
        # check revert reason
        r, e = eth_call(C["CollateralVault"], data)
        print(f"  Call sim err: {e}")
    record("CV.depositCollateral('AAPL', 100k GD)", success, f"gas={gas}", tx_hash, gas)
else:
    record("CV.depositCollateral('AAPL', 100k GD)", False, f"send failed: {err}")

# ─────────────────────────────────────────────────────────────
print("\n[8] CHECK POSITION after deposit")
args = encode_addr_str(MY_ADDR, "AAPL")
res, err = eth_call(C["CollateralVault"], "0x" + SEL["getPosition(address,string)"] + args)
if res and res != "0x" and len(res) > 130:
    collateral = int(res[2:66], 16)
    debt = int(res[66:130], 16)
    ratio = int(res[130:194], 16)
    print(f"  collateral: {collateral / 1e18:.4f} GD")
    print(f"  debt:       {debt / 1e18:.4f} synthetic")
    print(f"  ratio:      {ratio}")
    record("CV.getPosition(me, 'AAPL')", True, f"coll={collateral/1e18:.2f} debt={debt/1e18:.2f} ratio={ratio}")
else:
    print(f"  err: {err}")
    record("CV.getPosition(me, 'AAPL')", False, f"err={err}")

# ─────────────────────────────────────────────────────────────
print("\n[9] MINT SYNTHETIC AAPL (borrow against collateral)")
# Mint 100 synthetic AAPL (assuming 18 decimals, small amount relative to collateral)
mint_amount = 10 * 10**18
args = encode_str_uint("AAPL", mint_amount)
data = "0x" + SEL["mint(string,uint256)"] + args
tx_hash, err = send_tx(MY_ADDR, C["CollateralVault"], data)
if tx_hash:
    receipt = wait_receipt(tx_hash)
    gas = int(receipt["gasUsed"], 16) if receipt else 0
    success = receipt and receipt.get("status") == "0x1"
    if not success:
        r, e = eth_call(C["CollateralVault"], data)
        print(f"  Call sim err: {e}")
    record("CV.mint('AAPL', 10)", success, "", tx_hash, gas)
else:
    record("CV.mint('AAPL', 10)", False, f"send failed: {err}")

# ─────────────────────────────────────────────────────────────
print("\n[10] CHECK POSITION after mint")
res, err = eth_call(C["CollateralVault"], "0x" + SEL["getPosition(address,string)"] + args)
# Reuse same encode_addr_str for getPosition
pos_args = encode_addr_str(MY_ADDR, "AAPL")
res, err = eth_call(C["CollateralVault"], "0x" + SEL["getPosition(address,string)"] + pos_args)
if res and res != "0x" and len(res) > 130:
    collateral = int(res[2:66], 16)
    debt = int(res[66:130], 16)
    ratio = int(res[130:194], 16)
    print(f"  collateral: {collateral / 1e18:.4f} GD")
    print(f"  debt:       {debt / 1e18:.4f} synthetic AAPL")
    print(f"  ratio:      {ratio}")
    record("CV.getPosition (post-mint)", True, f"coll={collateral/1e18:.2f} debt={debt/1e18:.2f} ratio={ratio}")
else:
    record("CV.getPosition (post-mint)", False, str(err))

# ─────────────────────────────────────────────────────────────
print("\n[11] STRESS TEST — 10 rapid depositCollateral calls")
stress_gas = []
stress_hashes = []
for i in range(10):
    small_deposit = (i + 1) * 10**18  # 1 to 10 GD
    args = encode_str_uint("AAPL", small_deposit)
    data = "0x" + SEL["depositCollateral(string,uint256)"] + args
    t0 = time.time()
    tx_hash, err = send_tx(MY_ADDR, C["CollateralVault"], data)
    elapsed = (time.time() - t0) * 1000
    if tx_hash:
        receipt = wait_receipt(tx_hash)
        gas = int(receipt["gasUsed"], 16) if receipt else 0
        success = receipt and receipt.get("status") == "0x1"
        stress_gas.append(gas)
        stress_hashes.append(tx_hash)
        print(f"  [{i+1}] deposit {(i+1)} GD: {'OK' if success else 'REVERT'} gas={gas:,} tx={tx_hash[:14]}...")
    else:
        print(f"  [{i+1}] FAIL: {err}")

if stress_gas:
    avg_gas = sum(stress_gas) / len(stress_gas)
    record("Stress: 10x depositCollateral", len(stress_gas) == 10, f"avg_gas={avg_gas:.0f}")
else:
    record("Stress: 10x depositCollateral", False, "all failed")

# ─────────────────────────────────────────────────────────────
print("\n[12] GAS ANALYSIS — read operations")
gas_reads = {}
for sel_name, contract_key, label in [
    ("paused()", "CollateralVault", "CV.paused"),
    ("listedCount()", "SyntheticAssetFactory", "SAF.listedCount"),
    ("getReservesCount()", "GoodLendPool", "GLP.getReservesCount"),
]:
    t0 = time.time()
    res, err = view(C[contract_key], sel_name)
    elapsed = (time.time() - t0) * 1000
    gas_reads[label] = elapsed
    val = int(res, 16) if res and res != "0x" else "err"
    print(f"  {label}: {val} ({elapsed:.1f}ms)")

# ─────────────────────────────────────────────────────────────
print("\n[13] UBI FEE CHECK — GoodDollar transfer triggers fee?")
gd_ubi_before = erc20_bal(C["GoodDollarToken"], C["UBIFeeSplitter"])
# Transfer 1000 GD
data = "0x" + SEL["transfer(address,uint256)"] + pad32h(ADMIN[2:].lower()) + h(1000 * 10**18)
tx_hash, err = send_tx(MY_ADDR, C["GoodDollarToken"], data)
if tx_hash:
    receipt = wait_receipt(tx_hash)
    gas = int(receipt["gasUsed"], 16) if receipt else 0
    success = receipt and receipt.get("status") == "0x1"
    gd_ubi_after = erc20_bal(C["GoodDollarToken"], C["UBIFeeSplitter"])
    fee_collected = (gd_ubi_after - gd_ubi_before) / 1e18
    print(f"  UBI before: {gd_ubi_before/1e18:.6f} GD")
    print(f"  UBI after:  {gd_ubi_after/1e18:.6f} GD")
    print(f"  Fee collected: {fee_collected:.6f} GD")
    record("UBI fee on GD transfer", success, f"fee={fee_collected:.4f} GD", tx_hash, gas)
else:
    record("UBI fee on GD transfer", False, str(err))

# ─────────────────────────────────────────────────────────────
print("\n[14] GoodLendPool — supply MockUSDC")
usdc_bal = erc20_bal(C["MockUSDC"], MY_ADDR)
print(f"  MockUSDC balance: {usdc_bal / 1e6:.2f}")
if usdc_bal > 0:
    # Approve GLP
    data = "0x" + SEL["approve(address,uint256)"] + pad32h(C["GoodLendPool"][2:].lower()) + h(max_uint)
    tx_hash, err = send_tx(MY_ADDR, C["MockUSDC"], data)
    receipt = wait_receipt(tx_hash) if tx_hash else None
    gas1 = int(receipt["gasUsed"], 16) if receipt else 0

    # Check reserves count
    res, _ = view(C["GoodLendPool"], "getReservesCount()")
    reserve_count = int(res, 16) if res and res != "0x" else 0
    print(f"  GoodLendPool reserves: {reserve_count}")

    if reserve_count == 0:
        print("  SKIP: No reserves initialized in GoodLendPool")
        record("GLP.supply(USDC)", False, "no reserves initialized")
    else:
        # supply(address asset, uint256 amount)
        supply_amount = 1000 * 10**6  # 1000 USDC
        data = "0x" + SEL["supply(address,uint256)"] + pad32h(C["MockUSDC"][2:].lower()) + h(supply_amount)
        tx_hash, err = send_tx(MY_ADDR, C["GoodLendPool"], data)
        if tx_hash:
            receipt = wait_receipt(tx_hash)
            gas = int(receipt["gasUsed"], 16) if receipt else 0
            success = receipt and receipt.get("status") == "0x1"
            record("GLP.supply(USDC, 1000)", success, "", tx_hash, gas)
        else:
            record("GLP.supply(USDC, 1000)", False, f"send failed: {err}")
else:
    record("GLP.supply(USDC)", False, "no USDC balance")

# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("FINAL SUMMARY")
print("=" * 60)
passed = sum(1 for _, ok, _ in results if ok)
total = len(results)
print(f"  Tests passed: {passed}/{total}")

print("\nTRANSACTION HASHES:")
for name, tx in tx_hashes:
    print(f"  {tx}  ({name})")

print("\nGAS COSTS:")
for name, gas in gas_costs.items():
    print(f"  {gas:>10,}  {name}")

if failures:
    print(f"\nFAILURES ({len(failures)}):")
    for name, detail in failures:
        print(f"  FAIL: {name} — {detail}")
else:
    print("\nAll tests passed!")
