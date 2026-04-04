#!/bin/bash
# memclaw-bridge.sh — Bridge between Paperclip agents and MemClaw
# Usage: source this, then call memclaw_write/memclaw_search/memclaw_recall

MEMCLAW_API_URL="${MEMCLAW_API_URL:-https://memclaw.net}"
MEMCLAW_API_KEY="${MEMCLAW_API_KEY:-mc_CeTq_4XU0zzktKpAclK7U7NptghKEjEP}"
MEMCLAW_TENANT="${MEMCLAW_TENANT:-goodclaw2-at-gmail-com}"

memclaw_write() {
  local agent_id="${1:-unknown}"
  local content="$2"
  local memory_type="${3:-fact}"
  
  curl -s "$MEMCLAW_API_URL/api/memories" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $MEMCLAW_API_KEY" \
    -X POST -d "{
      \"tenant_id\": \"$MEMCLAW_TENANT\",
      \"agent_id\": \"$agent_id\",
      \"memory_type\": \"$memory_type\",
      \"content\": $(echo "$content" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read().strip()))'),
      \"visibility\": \"scope_team\"
    }"
}

memclaw_search() {
  local query="$1"
  local limit="${2:-5}"
  
  curl -s "$MEMCLAW_API_URL/api/search" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $MEMCLAW_API_KEY" \
    -X POST -d "{
      \"tenant_id\": \"$MEMCLAW_TENANT\",
      \"query\": $(echo "$query" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read().strip()))'),
      \"limit\": $limit
    }"
}

memclaw_recall() {
  local query="$1"
  local limit="${2:-5}"
  
  curl -s "$MEMCLAW_API_URL/api/recall" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $MEMCLAW_API_KEY" \
    -X POST -d "{
      \"tenant_id\": \"$MEMCLAW_TENANT\",
      \"query\": $(echo "$query" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read().strip()))'),
      \"limit\": $limit
    }"
}

echo "MemClaw bridge loaded. Functions: memclaw_write, memclaw_search, memclaw_recall"
