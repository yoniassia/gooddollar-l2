#!/usr/bin/env python3
"""Probe devnet for iteration 21 contract state."""
import subprocess, json

CAST = "/home/goodclaw/.foundry/bin/cast"
RPC  = "http://localhost:8545"

# Post-18:43 redeployment addresses
VAULT_FAC = "0xd5ac451b0c50b9476107823af206ed814a2e2580"
VEGDT     = "0x02b0b4efd909240fcb2eb5fae060dc60d112e3a4"
VM        = "0x1429859428c0abc9c2c47c8ee9fbaf82cfa0f20f"
GUSD      = "0xc351628eb244ec633d5f21fbd6621e1a683b1181"
SP        = "0xb0d4afd8879ed9f52b28595d31b441d079b2ca07"
GDT       = "0x36c02da8a0983159322a80ffe9f24b1acff8b570"
TESTER    = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"

def call(contract, sig, *args):
    cmd = [CAST, "call", "--rpc-url", RPC, contract, sig] + list(args)
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
    if r.returncode != 0:
        return f"ERR: {r.stderr.strip()[:80]}"
    return r.stdout.strip()

def code(addr):
    r = subprocess.run([CAST, "code", "--rpc-url", RPC, addr], capture_output=True, text=True, timeout=15)
    c = r.stdout.strip()
    return "DEPLOYED" if len(c) > 4 else "EMPTY"

print("=== Iteration 21 pre-flight probe ===")
print(f"\nVaultFactory({VAULT_FAC}): {code(VAULT_FAC)}")
print(f"  vaultCount: {call(VAULT_FAC, 'vaultCount()(uint256)')}")

# Get vault[0] address
v0 = call(VAULT_FAC, "vaults(uint256)(address)", "0")
print(f"  vault[0]: {v0}")
if "ERR" not in v0 and v0 != "0x0000000000000000000000000000000000000000":
    print(f"  vault[0] code: {code(v0)}")
    print(f"  vault[0].totalAssets: {call(v0, 'totalAssets()(uint256)')}")
    print(f"  vault[0].totalDebt:   {call(v0, 'totalDebt()(uint256)')}")
    print(f"  vault[0].asset:       {call(v0, 'asset()(address)')}")

print(f"\nVoteEscrowedGD({VEGDT}): {code(VEGDT)}")
admin_addr = call(VEGDT, "admin()(address)")
print(f"  admin: {admin_addr}")
print(f"  totalLocked: {call(VEGDT, 'totalLocked()(uint256)')}")

print(f"\nVaultManager({VM}): {code(VM)}")
print(f"  paused: {call(VM, 'paused()(bool)')}")

print(f"\ngUSD({GUSD}): {code(GUSD)}")
print(f"  totalSupply: {call(GUSD, 'totalSupply()(uint256)')}")

print(f"\nStabilityPool({SP}): {code(SP)}")
print(f"  totalDeposits: {call(SP, 'totalDeposits()(uint256)')}")
print(f"  drainEpoch:    {call(SP, 'drainEpoch()(uint256)')}")

print(f"\nGoodDollarToken({GDT}): {code(GDT)}")
print(f"  tester balance: {call(GDT, 'balanceOf(address)(uint256)', TESTER)}")
