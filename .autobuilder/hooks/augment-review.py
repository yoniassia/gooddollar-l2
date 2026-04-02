#!/usr/bin/env python3
"""Augment review: inject Paperclip context into the autobuilder's review phase.
Pulls recent feedback from Paperclip issues and feeds it to the reviewer agent."""
import json, os, sys, urllib.request

PAPERCLIP_URL = "http://127.0.0.1:3100"
COMPANY_ID = "7e8ba4ed-e545-4394-ad98-c0c855409a4e"

try:
    issues = json.loads(urllib.request.urlopen(
        f"{PAPERCLIP_URL}/api/companies/{COMPANY_ID}/issues?status=todo,in_progress,blocked"
    ).read())
    
    # Filter for L2-related issues with recent comments
    relevant = []
    for issue in issues:
        title = issue.get("title", "")
        if any(kw in title.lower() for kw in ["goodstock", "goodpredict", "goodperps", "l2", "goodswap", "frontend", "autobuilder"]):
            relevant.append(f"- [{issue.get('priority','?')}] {title} (status: {issue.get('status','?')})")
    
    if relevant:
        print("PAPERCLIP AGENT FEEDBACK (from the GoodDollar AI company):")
        print("The following Paperclip issues are relevant to this project:")
        for r in relevant[:10]:
            print(f"  {r}")
        print("\nConsider these priorities when reviewing the app.")
        print("Focus on issues marked 'critical' or 'high' priority first.")
except Exception as e:
    # Fail silently — don't block the autobuilder
    pass
