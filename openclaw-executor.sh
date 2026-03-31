#!/bin/bash
# openclaw-executor.sh — A codex-compatible wrapper that uses OpenClaw's gateway
# Usage: openclaw-executor.sh exec [options] <prompt>
# The autobuilder calls: codex exec --dangerously-bypass-approvals-and-sandbox [--model MODEL] PROMPT

# Parse args (skip "exec" and flags, grab the prompt which is the last arg)
PROMPT="${@: -1}"

# Use openclaw agent command to run the prompt
exec openclaw agent --message "$PROMPT" --deliver 2>&1
