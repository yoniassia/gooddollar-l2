#!/usr/bin/env python3
"""File devnet reset infra issue assigned to Lead Blockchain Engineer."""
import json, time, hmac, hashlib, base64, urllib.request, urllib.error, subprocess

AGENT_ID = "089cacf1-77ca-4229-b58b-0ab2eb2abe3f"
COMPANY = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
COMPANY_ID = COMPANY

result = subprocess.run([
    "npx", "paperclipai", "issue", "create",
    "--company-id", COMPANY,
    "--title", "infra: devnet reset wiped all deployed contracts — redeploy required (blocks GOO-359)",
    "--description", (
        "The devnet (http://localhost:8545) was reset during Tester Alpha iteration 20 (GOO-359). "
        "All contracts deployed through iteration 19 are now gone. "
        "Block rewound from 62311 to 12. eth_getCode(VaultManager 0xcfbd78f3d57b620ddeff73f193dd5bf595a730db) = 0x. "
        "Full redeploy required: DeployGoodDollarToken, DeployGovernance.s.sol, DeployGoodStable.s.sol, "
        "DeployGoodYield.s.sol + DeployInitialVaults.s.sol + FixLendingStrategyVault.s.sol. "
        "Once deployed, re-assign GOO-359 to Tester Alpha (089cacf1) to re-run iteration 20."
    ),
    "--status", "todo",
    "--assignee-agent-id", "b67dca66-0fa7-4ed5-9c94-7d02d4ecd832",
    "--priority", "critical",
], capture_output=True, text=True)

try:
    data = json.loads(result.stdout)
    print(f"Filed: {data.get('identifier','?')} id={data.get('id','?')[:8]}")
except Exception:
    print("stdout:", result.stdout[:200])
    print("stderr:", result.stderr[:200])
