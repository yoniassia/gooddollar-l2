#!/bin/bash
# Auto-update README.md version table from package.json files
# Run by DevOps Engineer agent or CI pipeline

set -e
cd "$(dirname "$0")/.."

README="README.md"
TODAY=$(date -u +%Y-%m-%d)

# Read versions
ROOT_V=$(node -p "require('./package.json').version" 2>/dev/null || echo "?")
FRONTEND_V=$(node -p "require('./frontend/package.json').version" 2>/dev/null || echo "?")
SDK_V=$(node -p "require('./sdk/package.json').version" 2>/dev/null || echo "?")

# Build version table
TABLE="| Component | Version | Status |
|-----------|---------|--------|
| **GoodDollar L2** (root) | \`${ROOT_V}\` | 🟢 Active |
| Frontend (GoodSwap) | \`${FRONTEND_V}\` | 🟢 Live |
| SDK | \`${SDK_V}\` | 🟢 Published |"

# Add backend services
for dir in backend/*/; do
    [ -f "${dir}package.json" ] || continue
    name=$(basename "$dir")
    pretty=$(echo "$name" | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')
    v=$(node -p "require('./${dir}package.json').version" 2>/dev/null || echo "?")
    TABLE="${TABLE}
| Backend — ${pretty} | \`${v}\` | 🟢 Running |"
done

# Replace between markers in README
python3 -c "
import re, sys

readme = open('${README}').read()
table = '''${TABLE}'''
date = '${TODAY}'

# Replace between VERSION_TABLE_START and VERSION_TABLE_END
pattern = r'(<!-- VERSION_TABLE_START -->).*?(<!-- VERSION_TABLE_END -->)'
replacement = f'\\1\n{table}\n\\2'
new_readme = re.sub(pattern, replacement, readme, flags=re.DOTALL)

# Update date
new_readme = re.sub(
    r'Auto-updated by DevOps Engineer agent\. Last sync: \d{4}-\d{2}-\d{2}',
    f'Auto-updated by DevOps Engineer agent. Last sync: {date}',
    new_readme
)

open('${README}', 'w').write(new_readme)
print(f'Updated README versions: root={\"${ROOT_V}\"}, frontend={\"${FRONTEND_V}\"}, sdk={\"${SDK_V}\"}')
"
