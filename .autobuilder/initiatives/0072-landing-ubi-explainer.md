---
id: gooddollar-l2-landing-ubi-explainer
title: "Add UBI Explainer Section to Landing Page for First-Time Users"
parent: gooddollar-l2
deps: []
split: null
depth: 1
planned: true
executed: true
---

## Problem Statement

The acronym "UBI" appears 4+ times on the landing page (hero tagline, subtitle, fee badge, How It Works cards) but is never defined or explained. "Universal basic income" appears once in the subtitle text but without context — a DeFi user coming from Uniswap or Aave has no idea what UBI is, why it matters, or how GoodDollar's system works.

The "How It Works" section partially explains the flow (swap → fees → people earn income) but doesn't explain:
- What UBI is as a concept
- How GoodDollar distributes it
- Who receives it and how many people benefit
- Why a DeFi user should care

This creates a "so what?" reaction for users who don't already know about GoodDollar. The app's core differentiator (every fee funds UBI) is lost because the value proposition isn't communicated clearly.

## User Story

As a DeFi user who has never heard of GoodDollar, I want a brief explainer that tells me what UBI is and why my trading fees funding it matters, so that I understand the social impact of using this platform and feel motivated to trade here instead of on a competitor.

## How It Was Found

Fresh-eyes review: Read the landing page top to bottom. Encountered "UBI" in the hero, badge, and How It Works. Understood it stands for "universal basic income" from the subtitle, but had no idea how it works, who receives it, or why this platform's approach is special. The stats at the bottom show "$2.4M UBI Distributed" and "640K+ Daily Claimers" but these numbers lack context without understanding the mechanism.

## Proposed UX

Add a compact "What is UBI?" or "Your Impact" section between the How It Works section and the platform showcase (or stats). The section should:

1. **Headline:** "What is UBI?" or "Your Fees, Their Income"
2. **Brief paragraph** (2-3 sentences max): "Universal Basic Income (UBI) is a regular cash payment to every verified human, regardless of employment. GoodDollar has been distributing UBI to 640,000+ people worldwide since 2020. When you trade on this platform, 33% of every fee goes directly to the UBI pool."
3. **Visual element:** A simple flow diagram or illustration showing: Your Trade → 33% Fee → UBI Pool → Daily Payout to Verified Humans
4. **CTA:** "Learn More" linking to GoodDollar docs (or anchor to the existing How It Works section)

Keep it concise — this is an attention hook, not a documentation page.

## Acceptance Criteria

- [ ] A UBI explainer section exists on the landing page
- [ ] The section clearly defines what UBI is in plain language
- [ ] The section mentions the number of beneficiaries (640K+) or dollar amount distributed
- [ ] The section explains the fee split (33% to UBI)
- [ ] The section has a visual element (diagram, icon flow, or illustration)
- [ ] The section fits the existing dark theme and design language
- [ ] Responsive: readable on mobile without horizontal scroll
- [ ] Existing tests pass

## Verification

- Run all tests and verify in browser with agent-browser
- Read the section as a "DeFi user who knows nothing about GoodDollar" — does it make sense?
- Check mobile layout (375px)

## Out of Scope

- Detailed GoodDollar protocol documentation
- Interactive UBI calculator
- Changing the existing How It Works section
- Adding external API calls for live UBI data
