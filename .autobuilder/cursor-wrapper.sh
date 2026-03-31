#!/bin/bash
# Wrapper that sets up cursor agent with API key
export PATH="$HOME/.cursor/bin:$HOME/.foundry/bin:$PATH"
source /home/goodclaw/.openclaw/workspace/.credentials/cursor-api.env
export CURSOR_API_KEY="$CURSOR_API_TOKEN"

# The autobuilder calls: cursor agent --print --yolo ... PROMPT
# "agent" subcommand is the binary name itself, so we need to handle this
# The autobuilder calls "cursor" which we need to map to "agent"
exec agent "$@"
