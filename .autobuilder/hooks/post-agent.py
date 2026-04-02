#!/usr/bin/env python3
"""Post-agent hook: sync autobuilder progress to Paperclip issues.
After each autobuilder iteration, update the relevant Paperclip tasks with progress."""
import json, os, sys, glob, urllib.request

PAPERCLIP_URL = "http://127.0.0.1:3100"
COMPANY_ID = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"
PROJECT_DIR = os.environ.get("AUTOBUILDER_PROJECT_DIR", "/home/goodclaw/gooddollar-l2")
ITERATION = os.environ.get("AUTOBUILDER_ITERATION", "?")

def api_get(path):
    try:
        return json.loads(urllib.request.urlopen(f"{PAPERCLIP_URL}/api/{path}").read())
    except:
        return None

def api_post_comment(issue_id, comment):
    try:
        body = json.dumps({"body": comment}).encode()
        req = urllib.request.Request(f"{PAPERCLIP_URL}/api/issues/{issue_id}/comments", body, {"Content-Type":"application/json"})
        urllib.request.urlopen(req)
        return True
    except:
        return False

def api_patch_issue(issue_id, data):
    try:
        body = json.dumps(data).encode()
        req = urllib.request.Request(f"{PAPERCLIP_URL}/api/issues/{issue_id}", body, {"Content-Type":"application/json"}, method="PATCH")
        urllib.request.urlopen(req)
        return True
    except:
        return False

# Count initiative stats
init_dir = os.path.join(PROJECT_DIR, ".autobuilder/initiatives")
total = planned = executed = 0
recently_executed = []

for f in sorted(glob.glob(os.path.join(init_dir, "*.md"))):
    with open(f) as fh:
        content = fh.read()
    total += 1
    if "executed: true" in content:
        executed += 1
    if "planned: true" in content:
        planned += 1
    # Get title
    for line in content.split("\n"):
        if line.startswith("title:"):
            title = line.split(":", 1)[1].strip().strip('"')
            if "executed: true" in content:
                recently_executed.append(title)
            break

pending = total - executed
progress_pct = int(executed / total * 100) if total > 0 else 0

# Find matching Paperclip issues and post updates
issues = api_get(f"companies/{COMPANY_ID}/issues") or []

# Map keywords to Paperclip issues
keyword_map = {
    "GoodStocks": "goodstocks",
    "GoodPredict": "goodpredict", 
    "GoodPerps": "goodperps",
    "L2": "l2",
    "GoodSwap": "goodswap",
}

updated = 0
for issue in issues:
    title = issue.get("title", "")
    issue_id = issue["id"]
    
    for keyword, tag in keyword_map.items():
        if keyword.lower() in title.lower():
            # Count feature-specific progress
            feature_total = 0
            feature_done = 0
            for f in sorted(glob.glob(os.path.join(init_dir, "*.md"))):
                with open(f) as fh:
                    content = fh.read()
                if tag.lower() in content.lower():
                    feature_total += 1
                    if "executed: true" in content:
                        feature_done += 1
            
            if feature_total > 0:
                comment = f"## Autobuilder Update (Iteration {ITERATION})\n\n"
                comment += f"**{keyword} progress:** {feature_done}/{feature_total} initiatives completed ({int(feature_done/feature_total*100)}%)\n\n"
                comment += f"**Overall L2:** {executed}/{total} initiatives ({progress_pct}%)\n"
                
                if feature_done == feature_total and feature_total > 0:
                    comment += f"\n✅ All {keyword} initiatives complete!"
                    api_patch_issue(issue_id, {"status": "in_review", "comment": comment})
                else:
                    api_post_comment(issue_id, comment)
                updated += 1
            break

# Also update the main L2 goal
for issue in issues:
    if "L2 with all core" in issue.get("title", ""):
        comment = f"## Autobuilder Iteration {ITERATION} Complete\n\n"
        comment += f"**Progress:** {executed}/{total} initiatives ({progress_pct}%)\n"
        comment += f"**Pending:** {pending} initiatives remaining\n"
        api_post_comment(issue["id"], comment)
        updated += 1
        break

print(f"Synced {updated} Paperclip issues (iteration {ITERATION}, {executed}/{total} done)")
sys.exit(0)  # Always succeed — don't block the autobuilder
