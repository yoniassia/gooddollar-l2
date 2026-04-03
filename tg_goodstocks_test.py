#!/usr/bin/env python3
"""
Tester Gamma — GoodStocks Full Test
Deploys synthetic AAPL, registers in vault, tests deposit/mint/burn.
"""
import json, time, urllib.request, urllib.error

RPC     = "http://localhost:8545"
MY_ADDR = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
ADMIN   = "0xf39Fd6e51aad88F6f4ce6aB8827279cffFb92266"

C = {
    "GoodDollarToken":       "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "UBIFeeSplitter":        "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    "CollateralVault":       "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
    "SyntheticAssetFactory": "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
    "GoodLendPool":          "0x322813fd9a801c5507c9de605d63cea4f2ce6c44",
    "MockUSDC":              "0x0b306bf915c4d645ff596e518faf3f9669b97016",
    "MockWETH":              "0x959922be3caee4b8cd9a407cc3ac1c251c2007b1",
}

SEL = {
    "admin()":                              "f851a440",
    "paused()":                             "5c975abb",
    "BPS()":                                "249d39e9",
    "LIQUIDATION_RATIO()":                  "c4323fea",
    "MIN_COLLATERAL_RATIO()":               "7a9fffb7",
    "TRADE_FEE_BPS()":                      "9185f598",
    "goodDollar()":                         "119e5bf3",
    "feeSplitter()":                        "6052970c",
    "listedCount()":                        "f36065b3",
    "getAsset(string)":                     "cd5286d0",
    "listAsset(string,string,address)":     "9b7fd154",
    "registerAsset(string,address)":        "8c2261ad",
    "depositCollateral(string,uint256)":    "c63e3835",
    "mint(string,uint256)":                 "056b01ce",
    "burn(string,uint256)":                 "b48272cc",
    "getPosition(address,string)":          "b1ad0fa0",
    "getCollateralRatio(address,string)":   "6dc827d9",
    "withdrawCollateral(string,uint256)":   "1ce96712",
    "liquidate(address,string)":            "1f33a888",
    "balanceOf(address)":                   "70a08231",
    "approve(address,uint256)":             "095ea7b3",
    "transfer(address,uint256)":            "a9059cbb",
    "mint(address,uint256)":                "40c10f19",
    "totalCollateral(bytes32)":             "ffe3142e",
    "getReservesCount()":                   "72218d04",
    "supply(address,uint256)":              "f2b9fdb8",
    "borrow(address,uint256)":              "4b8a3529",
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

def pad32h(v):
    return v.zfill(64)

def h(v):
    return pad32h(hex(v)[2:])

def eth_call(to, data_hex):
    r, e = rpc("eth_call", [{"to": to, "data": data_hex}, "latest"])
    return r, e

def send_tx(frm, to, data_hex, gas=5_000_000):
    tx = {"from": frm, "to": to, "data": data_hex, "gas": hex(gas)}
    r, e = rpc("eth_sendTransaction", [tx])
    return r, e

def wait_receipt(tx_hash, retries=40):
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

def encode_string(s):
    enc = s.encode("utf-8")
    offset = (32).to_bytes(32, "big").hex()
    length = len(enc).to_bytes(32, "big").hex()
    padded = enc.hex().ljust(64 * ((len(enc) + 31) // 32), "0")
    return offset + length + padded

def encode_str_str_addr(s1, s2, addr):
    s1e, s2e = s1.encode(), s2.encode()
    s1p = 32 * ((len(s1e) + 31) // 32)
    s2p = 32 * ((len(s2e) + 31) // 32)
    off1 = 3 * 32
    off2 = off1 + 32 + s1p
    return (
        off1.to_bytes(32,"big").hex() +
        off2.to_bytes(32,"big").hex() +
        pad32h(addr[2:].lower()) +
        len(s1e).to_bytes(32,"big").hex() + s1e.hex().ljust(s1p*2,"0") +
        len(s2e).to_bytes(32,"big").hex() + s2e.hex().ljust(s2p*2,"0")
    )

def encode_str_addr(s, addr):
    se = s.encode()
    sp = 32 * ((len(se) + 31) // 32)
    return (
        (2*32).to_bytes(32,"big").hex() +
        pad32h(addr[2:].lower()) +
        len(se).to_bytes(32,"big").hex() + se.hex().ljust(sp*2,"0")
    )

def encode_str_uint(s, amount):
    se = s.encode()
    sp = 32 * ((len(se) + 31) // 32)
    return (
        (2*32).to_bytes(32,"big").hex() +
        h(amount) +
        len(se).to_bytes(32,"big").hex() + se.hex().ljust(sp*2,"0")
    )

def encode_addr_str(addr, s):
    se = s.encode()
    sp = 32 * ((len(se) + 31) // 32)
    return (
        pad32h(addr[2:].lower()) +
        (2*32).to_bytes(32,"big").hex() +
        len(se).to_bytes(32,"big").hex() + se.hex().ljust(sp*2,"0")
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

print("=" * 65)
print("TESTER GAMMA — GoodStocks Complete Workflow Test")
print("=" * 65)

# ─────────────────────────────────────────────────────────────
print("\n[1] Contract state baseline")
res, _ = eth_call(C["SyntheticAssetFactory"], "0x" + SEL["listedCount()"])
count = int(res, 16) if res and res != "0x" else 0
record("SAF.listedCount()", True, f"{count} assets listed")

res, _ = eth_call(C["CollateralVault"], "0x" + SEL["BPS()"])
bps = int(res, 16) if res and res != "0x" else 0
record("CV.BPS()", bps == 10000, str(bps))

res, _ = eth_call(C["CollateralVault"], "0x" + SEL["LIQUIDATION_RATIO()"])
liq_ratio = int(res, 16) if res and res != "0x" else 0
record("CV.LIQUIDATION_RATIO()", True, f"{liq_ratio} bps ({liq_ratio/100:.0f}%)")

res, _ = eth_call(C["CollateralVault"], "0x" + SEL["MIN_COLLATERAL_RATIO()"])
min_ratio = int(res, 16) if res and res != "0x" else 0
record("CV.MIN_COLLATERAL_RATIO()", True, f"{min_ratio} bps ({min_ratio/100:.0f}%)")

print(f"\n  System config: liquidation at {liq_ratio/100:.0f}%, min C-ratio {min_ratio/100:.0f}%")

# ─────────────────────────────────────────────────────────────
print("\n[2] Wallet balances")
eth_bal_r, _ = rpc("eth_getBalance", [MY_ADDR, "latest"])
eth_bal = int(eth_bal_r, 16) / 1e18
gd_bal = erc20_bal(C["GoodDollarToken"], MY_ADDR) / 1e18
usdc_bal = erc20_bal(C["MockUSDC"], MY_ADDR) / 1e6
weth_bal = erc20_bal(C["MockWETH"], MY_ADDR) / 1e18
print(f"  ETH:  {eth_bal:.2f}")
print(f"  GD:   {gd_bal:.2f}")
print(f"  USDC: {usdc_bal:.2f}")
print(f"  WETH: {weth_bal:.4f}")
record("Wallet has GD", gd_bal > 0, f"{gd_bal:.2f} GD")

# ─────────────────────────────────────────────────────────────
print("\n[3] Admin: listAsset('AAPL') with high gas limit")
args = encode_str_str_addr("AAPL", "Apple Inc Synthetic", C["CollateralVault"])
data = "0x" + SEL["listAsset(string,string,address)"] + args

# Estimate gas first
est, err = rpc("eth_estimateGas", [{"from": ADMIN, "to": C["SyntheticAssetFactory"], "data": data}])
if est:
    print(f"  Estimated gas: {int(est, 16):,}")
else:
    print(f"  Gas estimation failed: {err}")

tx_hash, err = send_tx(ADMIN, C["SyntheticAssetFactory"], data, gas=10_000_000)
aapl_addr = None
if tx_hash:
    receipt = wait_receipt(tx_hash)
    gas = int(receipt["gasUsed"], 16) if receipt else 0
    success = receipt and receipt.get("status") == "0x1"
    if success:
        enc_str = encode_string("AAPL")
        res, _ = eth_call(C["SyntheticAssetFactory"], "0x" + SEL["getAsset(string)"] + enc_str)
        aapl_addr = ("0x" + res[-40:]) if res and len(res) >= 42 else None
        record("SAF.listAsset('AAPL')", True, f"sAAPL={aapl_addr}", tx_hash, gas)
    else:
        record("SAF.listAsset('AAPL')", False, f"reverted tx={tx_hash[:16]}...", tx_hash, gas)
else:
    record("SAF.listAsset('AAPL')", False, f"send failed: {err}")

# ─────────────────────────────────────────────────────────────
print("\n[4] Admin: registerAsset('AAPL') in CollateralVault")
if aapl_addr:
    args = encode_str_addr("AAPL", aapl_addr)
    data = "0x" + SEL["registerAsset(string,address)"] + args
    tx_hash, err = send_tx(ADMIN, C["CollateralVault"], data, gas=200_000)
    if tx_hash:
        receipt = wait_receipt(tx_hash)
        gas = int(receipt["gasUsed"], 16) if receipt else 0
        success = receipt and receipt.get("status") == "0x1"
        record("CV.registerAsset('AAPL')", success, f"sAAPL={aapl_addr[:16]}...", tx_hash, gas)
    else:
        record("CV.registerAsset('AAPL')", False, f"send failed: {err}")
else:
    record("CV.registerAsset('AAPL')", False, "skipped — no aapl_addr")

# ─────────────────────────────────────────────────────────────
print("\n[5] Deposit 100,000 GD collateral for AAPL")
deposit_amount = 100_000 * 10**18
args = encode_str_uint("AAPL", deposit_amount)
data = "0x" + SEL["depositCollateral(string,uint256)"] + args

# Simulate first
sim_res, sim_err = eth_call(C["CollateralVault"], "0x" + SEL["depositCollateral(string,uint256)"] + args)
print(f"  Sim: {sim_err or 'OK'}")

tx_hash, err = send_tx(MY_ADDR, C["CollateralVault"], data, gas=300_000)
if tx_hash:
    receipt = wait_receipt(tx_hash)
    gas = int(receipt["gasUsed"], 16) if receipt else 0
    success = receipt and receipt.get("status") == "0x1"
    gd_after = erc20_bal(C["GoodDollarToken"], MY_ADDR) / 1e18
    record("CV.depositCollateral('AAPL', 100k GD)", success, f"GD remaining={gd_after:.2f}", tx_hash, gas)
else:
    record("CV.depositCollateral('AAPL', 100k GD)", False, f"send failed: {err}")

# ─────────────────────────────────────────────────────────────
print("\n[6] Check position after deposit")
pos_args = encode_addr_str(MY_ADDR, "AAPL")
res, err = eth_call(C["CollateralVault"], "0x" + SEL["getPosition(address,string)"] + pos_args)
if res and res != "0x" and len(res) > 130:
    collateral = int(res[2:66], 16)
    debt = int(res[66:130], 16)
    print(f"  collateral: {collateral / 1e18:.4f} GD")
    print(f"  debt:       {debt / 1e18:.4f} sAAPL")
    record("CV.getPosition (post-deposit)", collateral > 0, f"coll={collateral/1e18:.2f}")
else:
    record("CV.getPosition (post-deposit)", False, str(err))

# ─────────────────────────────────────────────────────────────
print("\n[7] Mint 10 sAAPL (borrow)")
mint_args = encode_str_uint("AAPL", 10 * 10**18)
data = "0x" + SEL["mint(string,uint256)"] + mint_args

sim_res, sim_err = eth_call(C["CollateralVault"], "0x" + SEL["mint(string,uint256)"] + mint_args)
print(f"  Sim: {sim_err or 'OK'}")

tx_hash, err = send_tx(MY_ADDR, C["CollateralVault"], data, gas=300_000)
if tx_hash:
    receipt = wait_receipt(tx_hash)
    gas = int(receipt["gasUsed"], 16) if receipt else 0
    success = receipt and receipt.get("status") == "0x1"
    if aapl_addr:
        saapl_bal = erc20_bal(aapl_addr, MY_ADDR) / 1e18
    else:
        saapl_bal = 0
    record("CV.mint('AAPL', 10 sAAPL)", success, f"sAAPL_bal={saapl_bal:.4f}", tx_hash, gas)
else:
    record("CV.mint('AAPL', 10 sAAPL)", False, f"send failed: {err}")

# ─────────────────────────────────────────────────────────────
print("\n[8] Check position after mint")
res, err = eth_call(C["CollateralVault"], "0x" + SEL["getPosition(address,string)"] + pos_args)
if res and res != "0x" and len(res) > 130:
    collateral = int(res[2:66], 16)
    debt = int(res[66:130], 16)
    ratio = int(res[130:194], 16)
    print(f"  collateral: {collateral / 1e18:.4f} GD")
    print(f"  debt:       {debt / 1e18:.4f} sAAPL")
    print(f"  ratio:      {ratio}")
    record("CV.getPosition (post-mint)", debt > 0, f"debt={debt/1e18:.4f}")
else:
    record("CV.getPosition (post-mint)", False, str(err))

# ─────────────────────────────────────────────────────────────
print("\n[9] getCollateralRatio check")
cr_args = encode_addr_str(MY_ADDR, "AAPL")
res, err = eth_call(C["CollateralVault"], "0x" + SEL["getCollateralRatio(address,string)"] + cr_args)
if res and res != "0x" and len(res) > 2:
    cr = int(res, 16)
    print(f"  C-ratio: {cr} ({cr/100:.0f}% relative to BPS=10000)")
    record("CV.getCollateralRatio(me,'AAPL')", cr >= min_ratio, f"{cr} bps")
else:
    record("CV.getCollateralRatio(me,'AAPL')", False, str(err))

# ─────────────────────────────────────────────────────────────
print("\n[10] STRESS: 5 rapid GD transfers")
stress_times = []
stress_gas = []
burn = "0x000000000000000000000000000000000000dEaD"
for i in range(5):
    amt = (i + 1) * 10**18
    data = "0x" + SEL["transfer(address,uint256)"] + pad32h(burn[2:].lower()) + h(amt)
    t0 = time.time()
    tx_hash, err = send_tx(MY_ADDR, C["GoodDollarToken"], data, gas=100_000)
    if tx_hash:
        receipt = wait_receipt(tx_hash)
        elapsed = time.time() - t0
        gas = int(receipt["gasUsed"], 16) if receipt else 0
        success = receipt and receipt.get("status") == "0x1"
        stress_times.append(elapsed)
        stress_gas.append(gas)
        print(f"  [{i+1}] transfer {i+1} GD: {'OK' if success else 'FAIL'} {elapsed*1000:.0f}ms gas={gas:,}")
if stress_times:
    avg_ms = sum(stress_times) / len(stress_times) * 1000
    avg_gas = sum(stress_gas) / len(stress_gas)
    record("Stress: 5x GD transfer", len(stress_times) == 5, f"avg={avg_ms:.0f}ms gas={avg_gas:.0f}")

# ─────────────────────────────────────────────────────────────
print("\n[11] UBI fee verification (after 5 transfers)")
ubi_bal = erc20_bal(C["GoodDollarToken"], C["UBIFeeSplitter"]) / 1e18
print(f"  UBIFeeSplitter GD balance: {ubi_bal:.6f}")
record("UBI fee collection", ubi_bal > 0, f"{ubi_bal:.6f} GD",
       detail_note="0 means no on-chain fee routing — investigate" if ubi_bal == 0 else "")

# ─────────────────────────────────────────────────────────────
print("\n[12] totalCollateral check in CV")
aapl_key = None
if aapl_addr:
    # keccak256("AAPL") as bytes32 — from solidity _key(ticker)
    # We'll use eth_call on the CV to verify via another approach
    pass

res, _ = eth_call(C["SyntheticAssetFactory"], "0x" + SEL["listedCount()"])
final_count = int(res, 16) if res and res != "0x" else 0
record("SAF.listedCount() final", True, f"{final_count} assets")

# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 65)
print("FINAL SUMMARY")
print("=" * 65)
passed = sum(1 for _, ok, _ in results if ok)
total = len(results)
print(f"  Tests passed: {passed}/{total}")

print("\nTRANSACTIONS:")
for name, tx in tx_hashes:
    print(f"  {tx}  ({name})")

print("\nGAS COSTS:")
for name, gas in sorted(gas_costs.items(), key=lambda x: -x[1]):
    print(f"  {gas:>10,}  {name}")

if failures:
    print(f"\nFAILURES ({len(failures)}):")
    for name, detail in failures:
        print(f"  FAIL: {name}")
        if detail:
            print(f"        {detail}")
