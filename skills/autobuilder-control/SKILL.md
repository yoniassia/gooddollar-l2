---
name: autobuilder-control
description: >
  Control and steer the GoodDollar L2 autobuilder from Paperclip.
  Use to check build status, add priorities, or create new initiatives.
---

# Autobuilder Control Skill

The GoodDollar L2 autobuilder runs at `/home/goodclaw/gooddollar-l2` with data in `.autobuilder/`.

## Check Status
```bash
cat /home/goodclaw/gooddollar-l2/.autobuilder/status.md
```

## View All Initiatives
```bash
for f in /home/goodclaw/gooddollar-l2/.autobuilder/initiatives/*.md; do
  title=$(grep "^title:" "$f" | head -1 | sed 's/title: *//' | tr -d '"')
  executed=$(grep "^executed:" "$f" | head -1)
  echo "$(basename $f): $title — $executed"
done
```

## Add Priority (highest priority, consumed next iteration)
Write to `.autobuilder/backlog.md`:
```bash
echo "Fix the navigation bug on mobile" > /home/goodclaw/gooddollar-l2/.autobuilder/backlog.md
```

## Create New Initiative
Create a new file in `.autobuilder/initiatives/` with YAML frontmatter:
```yaml
---
title: "New Feature Name"
parent: gooddollar-l2
planned: false
executed: false
priority: high
depends_on: []
---
# Feature description here
```

## Stop/Start the Autobuilder
```bash
touch /home/goodclaw/gooddollar-l2/.autobuilder/stop     # Stop gracefully
rm /home/goodclaw/gooddollar-l2/.autobuilder/stop         # Allow restart
```

## View Recent Log
```bash
tail -50 /home/goodclaw/gooddollar-l2/.autobuilder/loop.log
```
