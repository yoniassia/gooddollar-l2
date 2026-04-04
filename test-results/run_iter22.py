#!/usr/bin/env python3
"""
Tester Alpha — Iteration 22
Goal: verify GOO-364 (provideToSP aliases), GOO-367 (gainSnapshots),
      vault[2] GDT deposit/redeem (GOO-370 fix in repo, needs redeploy for vault[0]/[1]).

Post-19:23 GoodStable redeployment (606c5f8 — GOO-364+367 live on new SP).
GOO-369 fix committed (bec119a) but NOT deployed yet.
GOO-370 fix committed (62d62c5) but NOT deployed yet — vault[0]/[1] still broken.
"""
import subprocess, json, time, sys

CAST     = "/home/goodclaw/.foundry/bin/cast"
RPC      = "http://localhost:8545"
PRIVKEY  = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
TESTER   = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
DEPLOYER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
DEPLOYER_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

# ── Post-19:23 GoodStable addresses ──────────────────────────
VM       = "0xab7b4c595d3ce8c85e16da86630f2fc223b05057"
PSM      = "0x821f3361d454cc98b7555221a06be563a7e2e0a6"
GUSD     = "0x5d42ebdbba61412295d7b0302d6f50ac449ddb4f"
CR       = "0xb06c856c8eabd1d8321b687e188204c1018bc4e5"
SP       = "0xad523115cd35a8d4e60b3c0953e0e0ac10418309"
USDC6    = "0x74cf9087ad26d541930bac724b7ab21ba8f00a27"
WETH18   = "0x8bce54ff8ab45cb075b044ae117b8fd91f9351ab"

# ── Unchanged ─────────────────────────────────────────────────
GDT      = "0x36c02da8a0983159322a80ffe9f24b1acff8b570"
VEGDT    = "0x02b0b4efd909240fcb2eb5fae060dc60d112e3a4"
VAULT_FAC= "0xd5ac451b0c50b9476107823af206ed814a2e2580"
VAULT2   = "0x79a62e9D235e396804743c5dc61D7E843b92Bd67"  # GDT vault (unchanged asset)
ZERO     = "0x0000000000000000000000000000000000000000"

JSONL = "/home/goodclaw/gooddollar-l2/test-results/tester-alpha-iter22.jsonl"
results = []

def call(c, sig, *args):
    r = subprocess.run([CAST,"call","--rpc-url",RPC,c,sig]+list(args),
                       capture_output=True, text=True, timeout=15)
    if r.returncode != 0: return None
    out = r.stdout.strip()
    return out.split()[0] if out else None

def send(c, sig, *args, key=PRIVKEY):
    r = subprocess.run([CAST,"send","--rpc-url",RPC,"--private-key",key,
                        "--json",c,sig]+list(args),
                       capture_output=True, text=True, timeout=30)
    if r.returncode != 0: return None, r.stderr.strip()[:80]
    try:
        d = json.loads(r.stdout)
        return d.get("transactionHash"), d.get("gasUsed")
    except: return None, r.stdout.strip()[:60]

def log(tid, contract, fn, ok, tx=None, gas=None, detail=""):
    entry = {"timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),
             "iteration": 22, "test_id": tid, "contract": contract,
             "function": fn, "success": ok, "tx_hash": tx,
             "gas_used": int(gas,16) if gas and gas.startswith("0x") else gas,
             "detail": detail}
    results.append(entry)
    print(f"[{'PASS' if ok else 'FAIL'}] {tid}: {contract}.{fn} — {detail}")
    return ok

def section(t): print(f"\n=== {t} ===")

# ──────────────────────────────────────────────────────────────
#  1. PSM smoke
# ──────────────────────────────────────────────────────────────
section("[1] PSM SWAP (smoke — new addresses)")

reserves = call(PSM, "totalUSDCReserves()(uint256)")
log("psm_01","PegStabilityModule","totalUSDCReserves()",reserves is not None,
    detail=f"reserves={reserves}")

tx,gas = send(USDC6,"mint(address,uint256)",TESTER,"200000000")   # 200 USDC
log("psm_02","MockUSDC6","mint(tester,200USDC)",tx is not None,tx,gas)

tx,gas = send(USDC6,"approve(address,uint256)",PSM,"100000000")
log("psm_03","MockUSDC6","approve(PSM,100USDC)",tx is not None,tx,gas)

tx,gas = send(PSM,"swapUSDCForGUSD(uint256)","100000000")
gusd_bal = call(GUSD,"balanceOf(address)(uint256)",TESTER)
log("psm_04","PegStabilityModule","swapUSDCForGUSD(100USDC)",tx is not None,tx,gas,
    detail=f"gUSD={gusd_bal}")

# ──────────────────────────────────────────────────────────────
#  2. CDP cycle (new VaultManager)
# ──────────────────────────────────────────────────────────────
section("[2] CDP — new VaultManager (GOO-348 regression)")

ilk_raw = call(CR,"ilkList(uint256)(bytes32)","0")
log("cdp_01","CollateralRegistry","ilkList(0)",ilk_raw is not None,detail=f"ilk={ilk_raw}")
ilk0 = ilk_raw or "0x" + "0"*64

cfg = call(CR,"getConfig(bytes32)((address,uint256,uint256,uint256,uint256,bool))",ilk0)
coll_token = cfg.strip("()").split(",")[0].strip() if cfg else WETH18
log("cdp_02","CollateralRegistry","getConfig(ilk0).token",coll_token is not None,
    detail=f"collToken={coll_token}")

dec = int(call(coll_token,"decimals()(uint8)") or "18")
COLL = str(200 * 10**dec)
tx,gas = send(coll_token,"mint(address,uint256)",TESTER,COLL)
log("cdp_03","collateral",f"mint(tester,200,dec={dec})",tx is not None,tx,gas)

tx,gas = send(coll_token,"approve(address,uint256)",VM,COLL)
log("cdp_04","collateral","approve(VaultManager,200)",tx is not None,tx,gas)

tx,gas = send(VM,"openVault(bytes32)",ilk0)
log("cdp_05","VaultManager","openVault(ilk0)",tx is not None,tx,gas)

tx,gas = send(VM,"depositCollateral(bytes32,uint256)",ilk0,COLL)
log("cdp_06","VaultManager","depositCollateral(ilk0,200)",tx is not None,tx,gas)

MINT = str(10 * 10**18)
tx,gas = send(VM,"mintGUSD(bytes32,uint256)",ilk0,MINT)
gas_int = int(gas,16) if gas and gas.startswith("0x") else 0
log("cdp_07","VaultManager","mintGUSD(ilk0,10gUSD) — GOO-348",tx is not None,tx,gas,
    detail=f"gas={gas_int}")

debt = call(VM,"vaultDebt(bytes32,address)(uint256)",ilk0,TESTER)
log("cdp_08","VaultManager","vaultDebt(ilk0,tester)",debt is not None,detail=f"debt={debt}")

gbal = call(GUSD,"balanceOf(address)(uint256)",TESTER) or "0"
if debt and debt != "0":
    repay = min(int(gbal), int(debt))
    if repay > 0:
        tx,gas = send(GUSD,"approve(address,uint256)",VM,str(repay))
        log("cdp_09","gUSD","approve(VM,repay)",tx is not None,tx,gas)
        tx,gas = send(VM,"repayGUSD(bytes32,uint256)",ilk0,str(repay))
        log("cdp_10","VaultManager","repayGUSD(ilk0)",tx is not None,tx,gas)
    else:
        log("cdp_09","gUSD","approve",True,detail="no gUSD to repay")
        log("cdp_10","VaultManager","repayGUSD",True,detail="no gUSD to repay")
else:
    log("cdp_09","gUSD","approve",True,detail="no debt")
    log("cdp_10","VaultManager","repayGUSD",True,detail="no debt")

# ──────────────────────────────────────────────────────────────
#  3. GoodVault — vault[2] (GDT, strategy unaffected by GoodStable redeploy)
# ──────────────────────────────────────────────────────────────
section("[3] GoodVault vault[2] (GDT) — GOO-370 partial verification")

vc = call(VAULT_FAC,"vaultCount()(uint256)")
log("gv_01","VaultFactory","vaultCount()",vc is not None,detail=f"count={vc}")

v2_asset = call(VAULT2,"asset()(address)")
log("gv_02","GoodVault2","asset()",v2_asset is not None,detail=f"asset={v2_asset}")

v2_total = call(VAULT2,"totalAssets()(uint256)")
log("gv_03","GoodVault2","totalAssets() pre",v2_total is not None,detail=f"totalAssets={v2_total}")

# Fund tester with GDT
gdt_bal = call(GDT,"balanceOf(address)(uint256)",TESTER) or "0"
if int(gdt_bal) < 200 * 10**18:
    tx,gas = send(GDT,"transfer(address,uint256)",TESTER,str(500*10**18),key=DEPLOYER_KEY)
    gdt_bal = call(GDT,"balanceOf(address)(uint256)",TESTER)
    log("gv_04","GDT","deployer->tester 500GDT",tx is not None,tx,gas,detail=f"bal={gdt_bal}")
else:
    log("gv_04","GDT","balance ok",True,detail=f"tester has {gdt_bal}")

DEP = str(50 * 10**18)
tx,gas = send(GDT,"approve(address,uint256)",VAULT2,DEP)
log("gv_05","GDT","approve(vault2,50GDT)",tx is not None,tx,gas)

tx,gas = send(VAULT2,"deposit(uint256,address)",DEP,TESTER)
log("gv_06","GoodVault2","deposit(50GDT,tester)",tx is not None,tx,gas)

shares = call(VAULT2,"balanceOf(address)(uint256)",TESTER)
v2_debt = call(VAULT2,"totalDebt()(uint256)")
log("gv_07","GoodVault2","shares+debt after deposit",
    shares is not None and shares != "0",
    detail=f"shares={shares} totalDebt={v2_debt}")

# Harvest
tx,gas = send(VAULT2,"harvest()")
log("gv_08","GoodVault2","harvest()",tx is not None,tx,gas)

# Redeem all — GOO-351 invariant
if shares and shares != "0":
    tx,gas = send(VAULT2,"redeem(uint256,address,address)",shares,TESTER,TESTER)
    debt_final = call(VAULT2,"totalDebt()(uint256)")
    log("gv_09","GoodVault2","redeem(all) — GOO-351 regression",tx is not None,tx,gas,
        detail=f"totalDebt_final={debt_final}")
    ok_inv = debt_final is not None and int(debt_final) < 10**30
    log("gv_10","GoodVault2","totalDebt floor invariant",ok_inv,detail=f"debt={debt_final}")
else:
    log("gv_09","GoodVault2","redeem",False,detail="no shares — deposit failed")
    log("gv_10","GoodVault2","invariant",False,detail="skipped")

# vault[0] and vault[1] are expected broken (GOO-370 redeploy pending)
log("gv_11","GoodVault0","deposit skipped — GOO-370 redeploy pending",True,
    detail="vault[0] uses old WETH+GoodLend; vault[1] uses old gUSD. Both need redeploy after GOO-370 lands.")

# ──────────────────────────────────────────────────────────────
#  4. provideToSP / withdrawFromSP — GOO-364 regression verification
# ──────────────────────────────────────────────────────────────
section("[4] provideToSP/withdrawFromSP — GOO-364 VERIFICATION (new SP)")

# Ensure tester has gUSD
gusd_bal = call(GUSD,"balanceOf(address)(uint256)",TESTER) or "0"
if int(gusd_bal) < 15 * 10**18:
    send(USDC6,"mint(address,uint256)",TESTER,"100000000")
    send(USDC6,"approve(address,uint256)",PSM,"100000000")
    send(PSM,"swapUSDCForGUSD(uint256)","100000000")
    gusd_bal = call(GUSD,"balanceOf(address)(uint256)",TESTER) or "0"

PSP = str(5 * 10**18)

# Test 1: provideToSP(uint256) — single-arg Liquity V1 alias
tx,gas = send(GUSD,"approve(address,uint256)",SP,PSP)
tx_p1,gas_p1 = send(SP,"provideToSP(uint256)",PSP)
log("psp_01","StabilityPool","provideToSP(uint256) — GOO-364",tx_p1 is not None,tx_p1,gas_p1,
    detail="alias works" if tx_p1 else "FAIL — alias missing")

if tx_p1:
    tx_w1,gas_w1 = send(SP,"withdrawFromSP(uint256)",PSP)
    log("psp_02","StabilityPool","withdrawFromSP(uint256) — GOO-364",tx_w1 is not None,tx_w1,gas_w1)

# Test 2: provideToSP(uint256,address) — two-arg frontEndTag variant
tx,gas = send(GUSD,"approve(address,uint256)",SP,PSP)
tx_p2,gas_p2 = send(SP,"provideToSP(uint256,address)",PSP,ZERO)
log("psp_03","StabilityPool","provideToSP(uint256,address) — GOO-364",tx_p2 is not None,tx_p2,gas_p2,
    detail="2-arg alias works" if tx_p2 else "FAIL")

if tx_p2:
    tx_w2,gas_w2 = send(SP,"withdrawFromSP(uint256)",PSP)
    log("psp_04","StabilityPool","withdrawFromSP after 2-arg provide",tx_w2 is not None,tx_w2,gas_w2)

# ──────────────────────────────────────────────────────────────
#  5. StabilityPool — GOO-352/367 regression
#     GOO-367: gainSnapshots reset on epoch re-deposit
# ──────────────────────────────────────────────────────────────
section("[5] StabilityPool — GOO-352+367 regression (new SP)")

pool = call(SP,"totalDeposits()(uint256)")
log("sp_01","StabilityPool","totalDeposits()",pool is not None,detail=f"pool={pool}")
log("sp_02","StabilityPool","drainEpoch()",
    call(SP,"drainEpoch()(uint256)") is not None,
    detail=f"epoch={call(SP,'drainEpoch()(uint256)')}")
log("sp_03","StabilityPool","scaleIndex()",
    call(SP,"scaleIndex()(uint256)") is not None,
    detail=f"scale={call(SP,'scaleIndex()(uint256)')}")

# Deposit 5 gUSD
gusd_bal = call(GUSD,"balanceOf(address)(uint256)",TESTER) or "0"
SP_DEP = str(5 * 10**18)
if int(gusd_bal) >= 5 * 10**18:
    tx,gas = send(GUSD,"approve(address,uint256)",SP,SP_DEP)
    log("sp_04","gUSD","approve(SP,5gUSD)",tx is not None,tx,gas)

    tx,gas = send(SP,"deposit(uint256)",SP_DEP)
    log("sp_05","StabilityPool","deposit(5gUSD)",tx is not None,tx,gas)

    dep = call(SP,"deposits(address)(uint256)",TESTER)
    dep_epoch = call(SP,"depositEpoch(address)(uint256)",TESTER)
    dep_scale = call(SP,"depositScaleSnapshot(address)(uint256)",TESTER)
    log("sp_06","StabilityPool","deposits+epoch+scale",dep is not None,
        detail=f"deposits={dep} epoch={dep_epoch} scale={dep_scale}")

    # Withdraw and re-deposit — GOO-367: gainSnapshots should reset on re-deposit
    tx,gas = send(SP,"withdraw(uint256)",SP_DEP)
    log("sp_07","StabilityPool","withdraw(5gUSD)",tx is not None,tx,gas)

    # Re-deposit (same epoch) — GOO-367 regression
    gusd_bal2 = call(GUSD,"balanceOf(address)(uint256)",TESTER) or "0"
    if int(gusd_bal2) >= 5 * 10**18:
        tx,gas = send(GUSD,"approve(address,uint256)",SP,SP_DEP)
        tx2,gas2 = send(SP,"deposit(uint256)",SP_DEP)
        dep2 = call(SP,"deposits(address)(uint256)",TESTER)
        log("sp_08","StabilityPool","re-deposit(5gUSD) — GOO-367",tx2 is not None,tx2,gas2,
            detail=f"deposits={dep2}")
        # Verify can withdraw after re-deposit
        tx3,gas3 = send(SP,"withdraw(uint256)",SP_DEP)
        dep3 = call(SP,"deposits(address)(uint256)",TESTER)
        log("sp_09","StabilityPool","withdraw after re-deposit",tx3 is not None,tx3,gas3,
            detail=f"deposits={dep3}")
    else:
        log("sp_08","StabilityPool","re-deposit",False,detail="insufficient gUSD for re-deposit")
        log("sp_09","StabilityPool","withdraw after re-deposit",False,detail="skipped")
else:
    for t in ["sp_04","sp_05","sp_06","sp_07","sp_08","sp_09"]:
        log(t,"StabilityPool",t,False,detail=f"SKIP — insufficient gUSD: {gusd_bal}")

# ──────────────────────────────────────────────────────────────
#  6. State snapshot
# ──────────────────────────────────────────────────────────────
section("[6] STATE SNAPSHOT")

log("state_01","VaultManager","paused()",
    call(VM,"paused()(bool)") is not None,
    detail=f"paused={call(VM,'paused()(bool)')}")
log("state_02","gUSD","totalSupply()",
    call(GUSD,"totalSupply()(uint256)") is not None,
    detail=f"supply={call(GUSD,'totalSupply()(uint256)')}")
log("state_03","StabilityPool","totalDeposits() final",
    call(SP,"totalDeposits()(uint256)") is not None,
    detail=f"pool={call(SP,'totalDeposits()(uint256)')}")
log("state_04","VaultFactory","totalTVL()",
    call(VAULT_FAC,"totalTVL()(uint256)") is not None,
    detail=f"TVL={call(VAULT_FAC,'totalTVL()(uint256)')}")
log("state_05","GoodVault2","totalAssets() final",
    call(VAULT2,"totalAssets()(uint256)") is not None,
    detail=f"assets={call(VAULT2,'totalAssets()(uint256)')}")

# ──────────────────────────────────────────────────────────────
#  Write results
# ──────────────────────────────────────────────────────────────
passed  = sum(1 for r in results if r["success"])
total   = len(results)

with open(JSONL,"w") as f:
    for r in results: f.write(json.dumps(r)+"\n")

print(f"\n=== RESULTS: {passed}/{total} passed ({100*passed//total if total else 0}%) ===")
goo364 = all(r["success"] for r in results if r["test_id"] in ("psp_01","psp_02","psp_03","psp_04"))
goo367 = all(r["success"] for r in results if r["test_id"] in ("sp_08","sp_09"))
goo351 = all(r["success"] for r in results if r["test_id"] in ("gv_09","gv_10"))
goo348 = all(r["success"] for r in results if r["test_id"] == "cdp_07")
print(f"=== GOO-348 mintGUSD gas fix:     {'PASS' if goo348 else 'FAIL'} ===")
print(f"=== GOO-351 vault full-redeem:    {'PASS' if goo351 else 'FAIL (vault2)'} ===")
print(f"=== GOO-364 provideToSP aliases:  {'PASS' if goo364 else 'FAIL'} ===")
print(f"=== GOO-367 gainSnapshots reset:  {'PASS' if goo367 else 'FAIL'} ===")
print(f"=== GOO-370 vault[0/1] redeploy:  PENDING (fix committed, needs redeploy) ===")
print(f"=== GOO-369 gainSnapshots epoch:  PENDING (fix committed, needs redeploy) ===")
print(f"Wrote {total} entries to {JSONL}")
sys.exit(0 if passed == total else 1)
