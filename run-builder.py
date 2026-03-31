#!/usr/bin/env python3
"""
GoodDollar L2 Builder Loop — OpenClaw Edition

Instead of calling cursor/codex CLI, this spawns OpenClaw ACP sessions
to do the actual coding work. Same autobuilder logic, different executor.

Usage:
    python3 run-builder.py
"""

import json
import os
import subprocess
import sys
import time
from pathlib import Path

PROJECT_DIR = Path(__file__).parent.resolve()
AUTOBUILDER_DIR = PROJECT_DIR / ".autobuilder"
INITIATIVES_DIR = AUTOBUILDER_DIR / "initiatives"
SCOPE_FILE = AUTOBUILDER_DIR / "scope.md"
STATUS_FILE = AUTOBUILDER_DIR / "status.md"
LOG_FILE = AUTOBUILDER_DIR / "loop.log"
STOP_FILE = AUTOBUILDER_DIR / "stop"

def log(msg):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def write_status(iteration, phase, msg):
    STATUS_FILE.write_text(f"""# GoodDollar L2 Builder Status
- **Iteration:** {iteration}
- **Phase:** {phase}
- **Status:** {msg}
- **Updated:** {time.strftime("%Y-%m-%d %H:%M:%S UTC")}
""")

def load_initiatives():
    """Load all initiative files and categorize them."""
    unplanned = []
    planned_unexecuted = []
    executed = []
    
    for f in sorted(INITIATIVES_DIR.glob("*.md")):
        content = f.read_text()
        # Parse YAML frontmatter
        if content.startswith("---"):
            end = content.index("---", 3)
            frontmatter = content[3:end]
            is_planned = "planned: true" in frontmatter
            is_executed = "executed: true" in frontmatter
            
            if is_executed:
                executed.append(f)
            elif is_planned:
                planned_unexecuted.append(f)
            else:
                unplanned.append(f)
    
    return unplanned, planned_unexecuted, executed

def run_openclaw_agent(prompt, cwd):
    """Run a coding task via openclaw agent command."""
    log(f"Spawning OpenClaw agent in {cwd}")
    log(f"Prompt length: {len(prompt)} chars")
    
    # Write prompt to a temp file (too long for command line)
    prompt_file = AUTOBUILDER_DIR / "current_prompt.md"
    prompt_file.write_text(prompt)
    
    # Use openclaw agent command
    cmd = [
        "openclaw", "agent",
        "--message", f"Read the prompt at {prompt_file} and execute the instructions. Work in {cwd}.",
    ]
    
    try:
        result = subprocess.run(
            cmd, cwd=str(cwd), capture_output=True, text=True, timeout=3600
        )
        log(f"Agent exit code: {result.returncode}")
        if result.stdout:
            log(f"Agent output (last 500 chars): {result.stdout[-500:]}")
        if result.stderr:
            log(f"Agent stderr (last 500 chars): {result.stderr[-500:]}")
        return result.returncode
    except subprocess.TimeoutExpired:
        log("Agent timed out after 1 hour")
        return 124
    except Exception as e:
        log(f"Agent error: {e}")
        return 1

def build_prompt(iteration, phase, scope, initiatives_info):
    """Build the prompt for the coding agent."""
    prompt = f"""# GoodDollar L2 Builder — Iteration {iteration}

You are an autonomous builder agent working on the GoodDollar L2 project.
Project directory: {PROJECT_DIR}

## Scope
{scope}

## Current Phase: {phase}

## Your Task
"""
    
    if phase == "plan":
        prompt += """
Plan the unplanned initiatives. For each:
1. Research what's needed
2. Create an architecture plan
3. Estimate if it fits in one week
4. If too large, split into smaller initiatives
5. Update the initiative file with planned: true

Read each initiative file in .autobuilder/initiatives/ and plan the unplanned ones.
"""
    elif phase == "execute":
        prompt += """
Execute the next planned-but-unexecuted initiative using TDD:
1. Read the initiative plan
2. Write failing tests first
3. Implement the code to pass tests
4. Verify all tests pass
5. Commit with message format: "NNNN: description"
6. Mark the initiative as executed: true in its frontmatter

Work in the project directory. Use forge for Solidity development.
"""
    elif phase == "review":
        prompt += """
Review the current state of the project:
1. Run all tests (forge test)
2. Check what's been built vs scope
3. Identify gaps and improvements needed
4. Create new initiative files for improvements
5. Be ruthless — find everything that's missing

Write new initiatives to .autobuilder/initiatives/ with the next available number.
"""
    
    prompt += f"\n## Initiative Files\n{initiatives_info}\n"
    return prompt

def main():
    log("=" * 60)
    log("GoodDollar L2 Builder Loop starting")
    log(f"Project: {PROJECT_DIR}")
    log("=" * 60)
    
    iteration = 0
    
    while True:
        iteration += 1
        
        # Check stop signal
        if STOP_FILE.exists():
            log("Stop signal detected. Shutting down.")
            STOP_FILE.unlink()
            break
        
        log(f"\n{'='*60}")
        log(f"ITERATION {iteration}")
        log(f"{'='*60}")
        
        # Load scope
        scope = SCOPE_FILE.read_text() if SCOPE_FILE.exists() else "No scope defined"
        
        # Categorize initiatives
        unplanned, planned_unexecuted, executed = load_initiatives()
        
        log(f"Initiatives: {len(unplanned)} unplanned, {len(planned_unexecuted)} planned, {len(executed)} executed")
        
        # Determine phase
        if planned_unexecuted:
            phase = "execute"
            target = planned_unexecuted[0]
            log(f"Phase: EXECUTE — {target.name}")
        elif unplanned:
            phase = "plan"
            log(f"Phase: PLAN — {len(unplanned)} initiatives to plan")
        else:
            phase = "review"
            log(f"Phase: REVIEW — looking for improvements")
        
        write_status(iteration, phase, "Running...")
        
        # Build initiative info
        init_info = ""
        for f in sorted(INITIATIVES_DIR.glob("*.md")):
            init_info += f"\n### {f.name}\n```\n{f.read_text()[:500]}\n```\n"
        
        # Build and run prompt
        prompt = build_prompt(iteration, phase, scope, init_info)
        rc = run_openclaw_agent(prompt, PROJECT_DIR)
        
        if rc == 0:
            log(f"Iteration {iteration} completed successfully")
            # Git commit any changes
            subprocess.run(["git", "add", "-A"], cwd=str(PROJECT_DIR))
            result = subprocess.run(
                ["git", "diff", "--cached", "--quiet"], cwd=str(PROJECT_DIR)
            )
            if result.returncode != 0:
                subprocess.run(
                    ["git", "commit", "-m", f"autobuilder: iteration {iteration} ({phase})"],
                    cwd=str(PROJECT_DIR)
                )
                subprocess.run(["git", "push"], cwd=str(PROJECT_DIR))
                log("Changes committed and pushed")
            else:
                log("No changes to commit")
        else:
            log(f"Iteration {iteration} failed with code {rc}")
        
        write_status(iteration, phase, "Complete" if rc == 0 else f"Failed (rc={rc})")
        
        # Brief pause between iterations
        log("Sleeping 30s before next iteration...")
        time.sleep(30)
    
    log("Builder loop stopped.")

if __name__ == "__main__":
    main()
