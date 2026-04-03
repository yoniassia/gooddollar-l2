#!/usr/bin/env python3
"""Post test evidence on GOO-160."""
import sys, json, urllib.request, urllib.error
sys.path.insert(0, '/home/goodclaw/gooddollar-l2')
import tester_api as t

ISSUE_ID = "b7efbe9b-0000-0000-0000-000000000000"  # will be corrected below

# First find GOO-160's ID
inbox = t.api("GET", "/agents/me/inbox-lite")
goo160 = None
for item in inbox:
    if item.get("identifier") == "GOO-160":
        goo160 = item["id"]
        break

# If not in my inbox, search
if not goo160:
    issues = t.api("GET", "/companies/" + t.COMPANY + "/issues?q=LiFiBridgeAggregator+misconfigured")
    for item in issues:
        if "LiFiBridgeAggregator" in item.get("title", ""):
            goo160 = item["id"]
            print("Found via search:", goo160)
            break

# Get from pc inbox
import pc_api
pc_inbox = pc_api.api("GET", "/agents/me/inbox-lite")
for item in pc_inbox:
    if item.get("identifier") == "GOO-160":
        goo160 = item["id"]
        break

print("GOO-160 ID:", goo160)

if goo160:
    comment = "\n".join([
        "## Tester Alpha — Devnet Test Evidence for GOO-160",
        "",
        "Test run: 2026-04-03, devnet block 17000+",
        "",
        "### Setup Issues Found",
        "",
        "Initial state when testing `initiateSwapETH`:",
        "- `ubiFeeSplitter` = 0x8f86403A4DE0BB5791fa46B8e795C547942fE4Cf (MockUBIFeeSplitter from GoodStable)",
        "- `MockUBIFeeSplitter` has no `receive()` or `fallback()` function",
        "- Therefore `ubiFeeSplitter.call{value: fee}('')` always fails",
        "",
        "### Test Results",
        "",
        "| Test | Result |",
        "|------|--------|",
        "| batchWhitelistTokens(USDC, WETH) by admin | PASS tx=0xc2970fa4... |",
        "| setSupportedChain(42069) | PASS tx=0x6bdb1526... |",
        "| Approve USDC for aggregator | PASS tx=0xe2e50106... |",
        "| initiateSwap USDC->WETH chain 42069 | PASS tx=0x8f06b9ea... |",
        "| Swap state = Pending after initiate | PASS |",
        "| **initiateSwapETH 1ETH->USDC** | **FAIL** |",
        "",
        "### Revert from initiateSwapETH",
        "",
        "```",
        "require(sent, 'ETH fee transfer failed')",
        "  at LiFiBridgeAggregator.sol:246",
        "  ubiFeeSplitter = 0x8f86403A...",
        "  fee = 1e15 wei (10 bps of 1 ETH)",
        "```",
        "",
        "### What Does Work",
        "",
        "`initiateSwap` (token-to-token) works when tokens are whitelisted.",
        "The swap record is created correctly with Pending status and correct fields.",
        "",
        "Assigned to Protocol Engineer for fix.",
    ])

    url = t.API_URL + "/api/issues/" + goo160 + "/comments"
    data = json.dumps({"body": comment}).encode()
    req = urllib.request.Request(url, data=data, method="POST", headers={
        "Authorization": "Bearer " + t.TOKEN,
        "X-Paperclip-Run-Id": t.RUN_ID,
        "Content-Type": "application/json",
        "Accept": "application/json",
    })
    try:
        with urllib.request.urlopen(req) as r:
            print("Posted comment, status:", r.status)
    except urllib.error.HTTPError as e:
        print("HTTP Error:", e.code)
        # Check if posted anyway
        comments = t.api("GET", "/issues/" + goo160 + "/comments")
        print("Comments on GOO-160:", len(comments))
