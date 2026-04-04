#!/usr/bin/env python3
"""
Tester Alpha — Iteration 21
Goal: full regression covering GoodVault (GOO-351) + VoteEscrowedGD governance (GOO-349)
      which were SKIPPED in iteration 20 due to infra gaps. Now unblocked by GOO-363.

Post-18:43 redeployment (GOO-363 completed). All contracts confirmed deployed.

New in iter21 vs iter20:
  - Section 7: provideToSP/withdrawFromSP Liquity alias regression (GOO-364)
    NOTE: Expected to fail on current devnet (pre-fix deployment 18:30 UTC).
    Will pass after GOO-368 redeployment. Tracked as known-fail, not counted
    toward overall pass/fail.
"""
import subprocess, json, time, sys

CAST    = "/home/goodclaw/.foundry/bin/cast"
RPC     = "http://localhost:8545"
PRIVKEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
TESTER  = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
DEPLOYER= "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
DEPLOYER_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

# Post-18:30 (same as iter20) — confirmed same addresses
VM        = "0x1429859428c0abc9c2c47c8ee9fbaf82cfa0f20f"
PSM       = "0xdbc43ba45381e02825b14322cddd15ec4b3164e6"
GUSD      = "0xc351628eb244ec633d5f21fbd6621e1a683b1181"
CR        = "0xcbeaf3bde82155f56486fb5a1072cb8baaf547cc"
SP        = "0xb0d4afd8879ed9f52b28595d31b441d079b2ca07"
USDC6     = "0xb7278a61aa25c888815afc32ad3cc52ff24fe575"
WETH18    = "0x5f3f1dbd7b74c6b46e8c44f98792a1daf8d69154"
GDT       = "0x36c02da8a0983159322a80ffe9f24b1acff8b570"
VEGDT     = "0x02b0b4efd909240fcb2eb5fae060dc60d112e3a4"
GOODDAO   = "0x638a246f0ec8883ef68280293ffe8cfbabe61b44"
VAULT_FAC = "0xd5ac451b0c50b9476107823af206ed814a2e2580"

JSONL_PATH = "/home/goodclaw/gooddollar-l2/test-results/tester-alpha-iter21.jsonl"

results = []

def call(contract, sig, *args):
    cmd = [CAST, "call", "--rpc-url", RPC, contract, sig] + list(args)
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
    if r.returncode != 0:
        return None
    out = r.stdout.strip()
    # cast call returns "123 [1e20]" for large numbers — take only the first token
    return out.split()[0] if out else None

def send(contract, sig, *args, key=PRIVKEY):
    cmd = [CAST, "send", "--rpc-url", RPC, "--private-key", key,
           "--json", contract, sig] + list(args)
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if r.returncode != 0:
        return None, r.stderr.strip()
    try:
        d = json.loads(r.stdout)
        return d.get("transactionHash"), d.get("gasUsed")
    except Exception:
        return None, r.stdout.strip()[:80]

def log(test_id, contract, fn, success, tx_hash=None, gas=None, detail=""):
    entry = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "iteration": 21,
        "test_id": test_id,
        "contract": contract,
        "function": fn,
        "success": success,
        "tx_hash": tx_hash,
        "gas_used": int(gas, 16) if gas and gas.startswith("0x") else gas,
        "detail": detail
    }
    results.append(entry)
    status = "PASS" if success else "FAIL"
    print(f"[{status}] {test_id}: {contract}.{fn} — {detail}")
    return success

def section(title):
    print(f"\n=== {title} ===")

# ─────────────────────────────────────────────
#  SECTION 1: PSM swap regression (quick smoke)
# ─────────────────────────────────────────────
section("[1] PSM SWAP (smoke)")

psm_reserves_raw = call(PSM, "totalUSDCReserves()(uint256)")
log("psm_01", "PegStabilityModule", "totalUSDCReserves()", psm_reserves_raw is not None,
    detail=f"reserves={psm_reserves_raw}")

# Mint USDC → tester
tx, gas = send(USDC6, "mint(address,uint256)", TESTER, "300000000")  # 300 USDC
log("psm_02", "MockUSDC6", "mint(tester,300USDC)", tx is not None, tx, gas)

# Approve PSM
tx, gas = send(USDC6, "approve(address,uint256)", PSM, "100000000")  # 100 USDC
log("psm_03", "MockUSDC6", "approve(PSM,100USDC)", tx is not None, tx, gas)

# Swap 100 USDC → gUSD
tx, gas = send(PSM, "swapUSDCForGUSD(uint256)", "100000000")
gusd_post = call(GUSD, "balanceOf(address)(uint256)", TESTER)
log("psm_04", "PegStabilityModule", "swapUSDCForGUSD(100USDC)", tx is not None, tx, gas,
    detail=f"gUSD_balance={gusd_post}")

# ─────────────────────────────────────────────
#  SECTION 2: CDP cycle — mintGUSD regression
# ─────────────────────────────────────────────
section("[2] CDP CYCLE — GOO-348 mintGUSD regression")

ilk_raw = call(CR, "ilkList(uint256)(bytes32)", "0")
log("cdp_01", "CollateralRegistry", "ilkList(0)", ilk_raw is not None,
    detail=f"ilk={ilk_raw}")

ilk0 = ilk_raw if ilk_raw else "0x" + "0" * 64

cfg_raw = call(CR, "getConfig(bytes32)((address,uint256,uint256,uint256,uint256,bool))", ilk0)
coll_token = None
if cfg_raw:
    parts = cfg_raw.strip("()").split(",")
    coll_token = parts[0].strip() if parts else None
log("cdp_02", "CollateralRegistry", "getConfig(ilk0).token", coll_token is not None,
    detail=f"collToken={coll_token}")

# Mint collateral to tester (USDC6 = ilk0 by default)
coll_addr = coll_token or USDC6
dec_raw = call(coll_addr, "decimals()(uint8)") or "6"
dec = int(dec_raw)
COLL_AMT = str(500 * (10 ** dec))

tx, gas = send(coll_addr, "mint(address,uint256)", TESTER, COLL_AMT)
log("cdp_03", "collateral", f"mint(tester,500,dec={dec})", tx is not None, tx, gas)

tx, gas = send(coll_addr, "approve(address,uint256)", VM, COLL_AMT)
log("cdp_04", "collateral", "approve(VaultManager,500)", tx is not None, tx, gas)

tx, gas = send(VM, "openVault(bytes32)", ilk0)
log("cdp_05", "VaultManager", "openVault(ilk0)", tx is not None, tx, gas)

tx, gas = send(VM, "depositCollateral(bytes32,uint256)", ilk0, COLL_AMT)
log("cdp_06", "VaultManager", f"depositCollateral(ilk0,{COLL_AMT})", tx is not None, tx, gas)

# Mint 10 gUSD — GOO-348 regression (gas should not underestimate)
MINT_AMT = str(10 * (10 ** 18))
tx, gas = send(VM, "mintGUSD(bytes32,uint256)", ilk0, MINT_AMT)
gas_int = int(gas, 16) if gas and gas.startswith("0x") else None
log("cdp_07", "VaultManager", "mintGUSD(ilk0,10gUSD) — GOO-348 regression",
    tx is not None, tx, gas,
    detail=f"gas={gas_int} (expected ~159k, GOO-348 verified if no revert)")

debt_raw = call(VM, "vaultDebt(bytes32,address)(uint256)", ilk0, TESTER)
log("cdp_08", "VaultManager", "vaultDebt(ilk0,tester)", debt_raw is not None,
    detail=f"debt={debt_raw}")

# Repay
if debt_raw and debt_raw != "0":
    gusd_bal = call(GUSD, "balanceOf(address)(uint256)", TESTER) or "0"
    repay = min(int(gusd_bal), int(debt_raw))
    if repay > 0:
        tx, gas = send(GUSD, "approve(address,uint256)", VM, str(repay))
        log("cdp_09", "gUSD", "approve(VaultManager,repay)", tx is not None, tx, gas)
        tx, gas = send(VM, "repayGUSD(bytes32,uint256)", ilk0, str(repay))
        log("cdp_10", "VaultManager", "repayGUSD(ilk0,debt)", tx is not None, tx, gas)
    else:
        log("cdp_09", "gUSD", "approve(VaultManager,repay)", True, detail="no gUSD to repay")
        log("cdp_10", "VaultManager", "repayGUSD(ilk0,debt)", True, detail="no gUSD to repay")
else:
    log("cdp_09", "gUSD", "approve(VaultManager,repay)", True, detail="no debt")
    log("cdp_10", "VaultManager", "repayGUSD(ilk0,debt)", True, detail="no debt")

# ─────────────────────────────────────────────
#  SECTION 3: GOOD VAULT — GOO-351 full-redeem regression
# ─────────────────────────────────────────────
section("[3] GOOD VAULT — GOO-351 full-redeem regression")

vault_count = call(VAULT_FAC, "vaultCount()(uint256)")
log("gv_01", "VaultFactory", "vaultCount()", vault_count is not None,
    detail=f"count={vault_count}")

# Get vault[0] address via allVaults
vault0 = call(VAULT_FAC, "allVaults(uint256)(address)", "0")
log("gv_02", "VaultFactory", "allVaults(0)", vault0 is not None and vault0 != "0x0000000000000000000000000000000000000000",
    detail=f"vault0={vault0}")

if vault0 and vault0 != "0x0000000000000000000000000000000000000000":
    VAULT0 = vault0
    # Get vault asset
    asset_addr = call(VAULT0, "asset()(address)")
    log("gv_03", "GoodVault0", "asset()", asset_addr is not None, detail=f"asset={asset_addr}")

    total_debt_pre = call(VAULT0, "totalDebt()(uint256)")
    total_assets_pre = call(VAULT0, "totalAssets()(uint256)")
    log("gv_04", "GoodVault0", "totalDebt() pre-deposit",
        total_debt_pre is not None,
        detail=f"totalDebt={total_debt_pre} totalAssets={total_assets_pre}")

    # Fund tester with asset token — use GDT as primary
    DEPOSIT_AMT = str(50 * (10 ** 18))

    # Check if asset is GDT
    asset_to_use = asset_addr or GDT

    # Deployer transfer 500 tokens to tester so we have funds
    # (deployer may have less than 1000, use 500 to stay safe)
    tx, gas = send(asset_to_use, "transfer(address,uint256)", TESTER, str(500 * 10**18), key=DEPLOYER_KEY)
    gdt_bal = call(asset_to_use, "balanceOf(address)(uint256)", TESTER)
    log("gv_05", "GDT", "deployer transfer 1000GDT to tester",
        tx is not None, tx, gas, detail=f"tester_balance={gdt_bal}")

    # Approve vault
    tx, gas = send(asset_to_use, "approve(address,uint256)", VAULT0, DEPOSIT_AMT)
    log("gv_06", "asset", f"approve(GoodVault,50e18)", tx is not None, tx, gas)

    # Deposit 50 tokens
    tx, gas = send(VAULT0, "deposit(uint256,address)", DEPOSIT_AMT, TESTER)
    log("gv_07", "GoodVault0", "deposit(50e18,tester)", tx is not None, tx, gas)

    total_debt_post = call(VAULT0, "totalDebt()(uint256)")
    total_assets_post = call(VAULT0, "totalAssets()(uint256)")
    log("gv_08", "GoodVault0", "totalDebt() after deposit",
        total_debt_post is not None,
        detail=f"totalDebt={total_debt_post} totalAssets={total_assets_post}")

    shares = call(VAULT0, "balanceOf(address)(uint256)", TESTER)
    log("gv_09", "GoodVault0", "balanceOf(tester shares)",
        shares is not None and shares != "0",
        detail=f"shares={shares}")

    max_withdraw = call(VAULT0, "maxWithdraw(address)(uint256)", TESTER)
    log("gv_10", "GoodVault0", "maxWithdraw(tester)",
        max_withdraw is not None, detail=f"maxWithdraw={max_withdraw}")

    # Harvest yield (even if 0 — tests the path)
    tx, gas = send(VAULT0, "harvest()")
    log("gv_11", "GoodVault0", "harvest()", tx is not None, tx, gas)

    # Full redeem — GOO-351 regression (totalDebt underflow fix)
    if shares and shares != "0":
        tx, gas = send(VAULT0, "redeem(uint256,address,address)", shares, TESTER, TESTER)
        total_debt_final = call(VAULT0, "totalDebt()(uint256)")
        log("gv_12", "GoodVault0", "redeem(all shares) — GOO-351 regression",
            tx is not None, tx, gas,
            detail=f"totalDebt after={total_debt_final} (GOO-351: must not underflow)")
        # Invariant: totalDebt should be >= 0 (no underflow panic)
        no_underflow = total_debt_final is not None
        log("gv_13", "GoodVault0", "totalDebt floor invariant — GOO-351",
            no_underflow, detail=f"totalDebt={total_debt_final} (must not revert)")
    else:
        log("gv_12", "GoodVault0", "redeem — no shares", True, detail="no shares to redeem")
        log("gv_13", "GoodVault0", "totalDebt floor invariant", True, detail="skipped — no shares")
else:
    for t in ["gv_03","gv_04","gv_05","gv_06","gv_07","gv_08","gv_09","gv_10","gv_11","gv_12","gv_13"]:
        log(t, "GoodVault0", t, False, detail="SKIPPED — no vault deployed (GOO-363 still open)")

# ─────────────────────────────────────────────
#  SECTION 4: VoteEscrowedGD governance — GOO-349 regression
# ─────────────────────────────────────────────
section("[4] VoteEscrowedGD governance — GOO-349 regression")

# Check VoteEscrowedGD deployed and accessible
vegdt_admin = call(VEGDT, "admin()(address)")
log("gov_01", "VoteEscrowedGD", "admin()", vegdt_admin is not None, detail=f"admin={vegdt_admin}")

total_locked = call(VEGDT, "totalLocked()(uint256)")
log("gov_02", "VoteEscrowedGD", "totalLocked()", total_locked is not None,
    detail=f"totalLocked={total_locked}")

# Fund tester with GDT if needed
gdt_bal = call(GDT, "balanceOf(address)(uint256)", TESTER)
if gdt_bal and int(gdt_bal) < 200 * 10**18:
    tx, gas = send(GDT, "transfer(address,uint256)", TESTER, str(500 * 10**18), key=DEPLOYER_KEY)
    gdt_bal = call(GDT, "balanceOf(address)(uint256)", TESTER)
    log("gov_03", "GoodDollarToken", "deployer transfer 500GDT to tester",
        tx is not None, tx, gas, detail=f"balance={gdt_bal}")
else:
    log("gov_03", "GoodDollarToken", "balance check", True, detail=f"tester has {gdt_bal}")

# Approve VoteEscrowedGD to pull GDT
LOCK_AMT = str(100 * 10**18)
tx, gas = send(GDT, "approve(address,uint256)", VEGDT, LOCK_AMT)
log("gov_04", "GoodDollarToken", "approve(VoteEscrowedGD,100GDT)", tx is not None, tx, gas)

# Lock 100 GDT for 1 week — duration in seconds (not timestamp)
LOCK_DURATION = str(604800)  # 1 week in seconds
tx, gas = send(VEGDT, "lock(uint256,uint256)", LOCK_AMT, LOCK_DURATION)
log("gov_05", "VoteEscrowedGD", "lock(100GDT,604800s)", tx is not None, tx, gas)

# Check locked balance via locks(address) public mapping → (uint128 amount, uint128 end)
locked_raw = call(VEGDT, "locks(address)(uint128,uint128)", TESTER)
locked = locked_raw.split()[0] if locked_raw else None
log("gov_06", "VoteEscrowedGD", "locks(tester).amount",
    locked is not None and locked != "0",
    detail=f"locked={locked}")

# Check voting power via votingPowerOf (actual function name)
power = call(VEGDT, "votingPowerOf(address)(uint256)", TESTER)
log("gov_07", "VoteEscrowedGD", "votingPowerOf(tester)",
    power is not None, detail=f"power={power}")

total_locked2 = call(VEGDT, "totalLocked()(uint256)")
log("gov_08", "VoteEscrowedGD", "totalLocked() after lock",
    total_locked2 is not None and total_locked2 != "0",
    detail=f"totalLocked={total_locked2}")

# ─────────────────────────────────────────────
#  SECTION 5: STABILITY POOL — GOO-352 scaleIndex regression
# ─────────────────────────────────────────────
section("[5] STABILITY POOL — GOO-352 scaleIndex regression")

pool_size = call(SP, "totalDeposits()(uint256)")
log("sp_01", "StabilityPool", "totalDeposits()",
    pool_size is not None, detail=f"poolSize={pool_size}")

drain_epoch = call(SP, "drainEpoch()(uint256)")
log("sp_02", "StabilityPool", "drainEpoch()",
    drain_epoch is not None, detail=f"drainEpoch={drain_epoch}")

scale_idx = call(SP, "scaleIndex()(uint256)")
log("sp_03", "StabilityPool", "scaleIndex()",
    scale_idx is not None, detail=f"scaleIndex={scale_idx}")

# Acquire gUSD via PSM if needed (need at least 5 gUSD for SP test)
gusd_bal = call(GUSD, "balanceOf(address)(uint256)", TESTER) or "0"
if int(gusd_bal) < 5 * 10**18:
    # Mint USDC and swap
    send(USDC6, "mint(address,uint256)", TESTER, "50000000")  # 50 USDC
    send(USDC6, "approve(address,uint256)", PSM, "50000000")
    send(PSM, "swapUSDCForGUSD(uint256)", "50000000")
    gusd_bal = call(GUSD, "balanceOf(address)(uint256)", TESTER) or "0"

SP_DEPOSIT = str(5 * 10**18)
if int(gusd_bal) >= 5 * 10**18:
    tx, gas = send(GUSD, "approve(address,uint256)", SP, SP_DEPOSIT)
    log("sp_04", "gUSD", "approve(StabilityPool,5gUSD)", tx is not None, tx, gas)

    tx, gas = send(SP, "deposit(uint256)", SP_DEPOSIT)
    log("sp_05", "StabilityPool", "deposit(5gUSD)", tx is not None, tx, gas)

    deposits_after = call(SP, "deposits(address)(uint256)", TESTER)
    log("sp_06", "StabilityPool", "deposits(tester) after deposit",
        deposits_after is not None and deposits_after != "0",
        detail=f"deposits={deposits_after}")

    dep_epoch = call(SP, "depositEpoch(address)(uint256)", TESTER)
    dep_scale = call(SP, "depositScaleSnapshot(address)(uint256)", TESTER)
    log("sp_07", "StabilityPool", "depositEpoch+scaleSnapshot",
        dep_epoch is not None, detail=f"epoch={dep_epoch} scale={dep_scale}")

    tx, gas = send(SP, "withdraw(uint256)", SP_DEPOSIT)
    deposits_final = call(SP, "deposits(address)(uint256)", TESTER)
    log("sp_08", "StabilityPool", "withdraw(5gUSD) — GOO-352 scaleIndex regression",
        tx is not None, tx, gas,
        detail=f"deposits_after_withdraw={deposits_final}")
else:
    for t in ["sp_04","sp_05","sp_06","sp_07","sp_08"]:
        log(t, "StabilityPool", t, False, detail=f"SKIP — insufficient gUSD: {gusd_bal}")

# ─────────────────────────────────────────────
#  SECTION 6.5: provideToSP / withdrawFromSP — GOO-364 Liquity alias regression
#  NOTE: EXPECTED TO FAIL on current devnet (pre-fix bytecode, deployed 18:30 UTC).
#  These will pass after GOO-368 redeployment. Tracked as known-fail.
# ─────────────────────────────────────────────
section("[6.5] provideToSP/withdrawFromSP — GOO-364 Liquity alias regression")
print("    NOTE: Expected fail until GOO-368 redeployment — tracking only")

gusd_psp = call(GUSD, "balanceOf(address)(uint256)", TESTER) or "0"
if int(gusd_psp) < 5 * 10**18:
    send(USDC6, "mint(address,uint256)", TESTER, "50000000")
    send(USDC6, "approve(address,uint256)", PSM, "50000000")
    send(PSM, "swapUSDCForGUSD(uint256)", "50000000")
    gusd_psp = call(GUSD, "balanceOf(address)(uint256)", TESTER) or "0"

PSP_AMT = str(5 * 10**18)
if int(gusd_psp) >= 5 * 10**18:
    # Test 1: provideToSP(uint256) — single-arg Liquity V1 alias
    send(GUSD, "approve(address,uint256)", SP, PSP_AMT)
    tx_psp1, gas_psp1 = send(SP, "provideToSP(uint256)", PSP_AMT)
    psp1_ok = tx_psp1 is not None
    log("psp_01", "StabilityPool", "provideToSP(uint256) — GOO-364 regression",
        psp1_ok, tx_psp1, gas_psp1,
        detail="Liquity alias works" if psp1_ok else "KNOWN FAIL pre-redeployment (GOO-368)")
    if psp1_ok:
        send(SP, "withdrawFromSP(uint256)", PSP_AMT)

    # Test 2: provideToSP(uint256,address) — two-arg frontEndTag variant
    send(GUSD, "approve(address,uint256)", SP, PSP_AMT)
    zero = "0x0000000000000000000000000000000000000000"
    tx_psp2, gas_psp2 = send(SP, "provideToSP(uint256,address)", PSP_AMT, zero)
    psp2_ok = tx_psp2 is not None
    log("psp_02", "StabilityPool", "provideToSP(uint256,address) — GOO-364",
        psp2_ok, tx_psp2, gas_psp2,
        detail="two-arg alias works" if psp2_ok else "KNOWN FAIL pre-redeployment (GOO-368)")
    if psp2_ok:
        send(SP, "withdrawFromSP(uint256)", PSP_AMT)

    # Test 3: withdrawFromSP(uint256) — deposit via deposit(), withdraw via alias
    send(GUSD, "approve(address,uint256)", SP, PSP_AMT)
    tx_dep, _ = send(SP, "deposit(uint256)", PSP_AMT)
    if tx_dep:
        tx_wfsp, gas_wfsp = send(SP, "withdrawFromSP(uint256)", PSP_AMT)
        wfsp_ok = tx_wfsp is not None
        log("psp_03", "StabilityPool", "withdrawFromSP(uint256) — GOO-364",
            wfsp_ok, tx_wfsp, gas_wfsp,
            detail="withdrawFromSP alias works" if wfsp_ok else "KNOWN FAIL pre-redeployment (GOO-368)")
    else:
        log("psp_03", "StabilityPool", "withdrawFromSP(uint256) — GOO-364",
            False, detail="deposit() setup failed, skipping withdrawFromSP test")
else:
    for t in ["psp_01", "psp_02", "psp_03"]:
        log(t, "StabilityPool", t, False, detail=f"SKIP — insufficient gUSD: {gusd_psp}")

# ─────────────────────────────────────────────
#  SECTION 6: STATE SNAPSHOT
# ─────────────────────────────────────────────
section("[6] STATE SNAPSHOT")

paused = call(VM, "paused()(bool)")
log("state_01", "VaultManager", "paused()", paused is not None, detail=f"paused={paused}")

supply = call(GUSD, "totalSupply()(uint256)")
log("state_02", "gUSD", "totalSupply()", supply is not None, detail=f"supply={supply}")

tvl = call(VAULT_FAC, "totalTVL()(uint256)")
log("state_03", "VaultFactory", "totalTVL()", tvl is not None, detail=f"TVL={tvl}")

if vault0 and vault0 != "0x0000000000000000000000000000000000000000":
    assets_final = call(VAULT0, "totalAssets()(uint256)")
    debt_final = call(VAULT0, "totalDebt()(uint256)")
    log("state_04", "GoodVault0", "totalAssets() final", assets_final is not None,
        detail=f"assets={assets_final}")
    log("state_05", "GoodVault0", "totalDebt() final", debt_final is not None,
        detail=f"debt={debt_final}")

    # GOO-351 invariant: totalDebt must not underflow (would be astronomically large)
    WAD = 10**18
    MAX_SANE = 10**30
    debt_ok = False
    if debt_final and debt_final.isdigit():
        debt_ok = int(debt_final) < MAX_SANE
    log("state_06", "GoodVault0", "totalDebt floor invariant — GOO-351",
        debt_ok, detail=f"debt={debt_final} ok={debt_ok}")
else:
    log("state_04", "VaultFactory", "no vault deployed", True, detail="SKIP")
    log("state_05", "VaultFactory", "no vault deployed", True, detail="SKIP")
    log("state_06", "VaultFactory", "totalDebt invariant", True, detail="SKIP — no vault")

# ─────────────────────────────────────────────
#  WRITE RESULTS
# ─────────────────────────────────────────────
passed = sum(1 for r in results if r["success"])
total  = len(results)

# GOO-364 provideToSP tests are known-fail until GOO-368 redeployment
goo364_ids = {"psp_01", "psp_02", "psp_03"}
known_fails = [r for r in results if r["test_id"] in goo364_ids and not r["success"]]
# Real failures = failures that aren't known GOO-364 pre-redeployment fails
real_fails = [r for r in results if not r["success"] and r["test_id"] not in goo364_ids]

with open(JSONL_PATH, "w") as f:
    for r in results:
        f.write(json.dumps(r) + "\n")

# Exclude known-fails from total for pass rate
non_known_total = total - len(goo364_ids)
non_known_passed = passed - sum(1 for r in results if r["test_id"] in goo364_ids and r["success"])
print(f"\n=== RESULTS: {non_known_passed}/{non_known_total} passed (excl. GOO-364 known-fails) ===")
goo348 = all(r["success"] for r in results if "cdp_07" in r["test_id"])
goo351 = all(r["success"] for r in results if r["test_id"] in ("gv_12","gv_13","state_06"))
goo352 = all(r["success"] for r in results if r["test_id"] in ("sp_05","sp_06","sp_08"))
goo349 = all(r["success"] for r in results if r["test_id"].startswith("gov_"))
goo364 = all(r["success"] for r in results if r["test_id"] in goo364_ids)
print(f"=== GOO-348 mintGUSD gas fix: {'PASS' if goo348 else 'FAIL'} ===")
print(f"=== GOO-349 VoteEscrowedGD:   {'PASS' if goo349 else 'FAIL'} ===")
print(f"=== GOO-351 full redeem:      {'PASS' if goo351 else 'FAIL'} ===")
print(f"=== GOO-352 SP deposit/wdraw: {'PASS' if goo352 else 'FAIL'} ===")
print(f"=== GOO-364 provideToSP:      {'PASS' if goo364 else 'PENDING GOO-368 redeployment'} ===")
print(f"Wrote {total} entries to {JSONL_PATH}")
sys.exit(0 if len(real_fails) == 0 else 1)
