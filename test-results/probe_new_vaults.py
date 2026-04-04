#!/usr/bin/env python3
"""Probe the new VaultFactory and CollateralRegistry for current addresses."""
import subprocess, json, os

CAST = os.path.expanduser("~/.foundry/bin/cast")
RPC = "http://localhost:8545"
VAULT_FAC = "0xd5ac451b0c50b9476107823af206ed814a2e2580"
CR_NEW = "0xcbeaf3bde82155f56486fb5a1072cb8baaf547cc"
GDT = "0x36c02da8a0983159322a80ffe9f24b1acff8b570"
VEGDT = "0x5b73c5498c1e3b4dba84de0f1833c4a029d90519"

def call(contract, sig, *args):
    cmd = [CAST, "call", "--rpc-url", RPC, contract, sig] + list(args)
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.stdout.strip(), r.stderr.strip()

print("=== VaultFactory ===")
count, _ = call(VAULT_FAC, "vaultCount()(uint256)")
print(f"vaultCount: {count}")
try:
    n = int(count)
    for i in range(n):
        v, _ = call(VAULT_FAC, "vaults(uint256)(address)", str(i))
        print(f"  vault[{i}] = {v}")
        if v:
            asset, _ = call(v, "asset()(address)")
            strat, _ = call(v, "strategy()(address)")
            ta, _ = call(v, "totalAssets()(uint256)")
            td, _ = call(v, "totalDebt()(uint256)")
            print(f"    asset={asset} strategy={strat}")
            print(f"    totalAssets={ta} totalDebt={td}")
except Exception as e:
    print(f"  error: {e}")

print("\n=== CollateralRegistry ===")
for i in range(3):
    ilk, _ = call(CR_NEW, "ilkList(uint256)(bytes32)", str(i))
    if ilk and ilk != "0x0000000000000000000000000000000000000000000000000000000000000000":
        cfg, _ = call(CR_NEW, "getConfig(bytes32)(address,uint256,uint256,uint256,uint256)", ilk)
        print(f"  ilk[{i}] = {ilk[:10]}... token={cfg.split()[0] if cfg else 'N/A'}")
    else:
        print(f"  ilk[{i}] = (empty)")
        break

print("\n=== GoodDollarToken ===")
ts, _ = call(GDT, "totalSupply()(uint256)")
print(f"totalSupply: {ts}")

print("\n=== VoteEscrowedGD ===")
gd, _ = call(VEGDT, "gd()(address)")
print(f"gd() = {gd}")
