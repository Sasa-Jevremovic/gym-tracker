#!/usr/bin/env bash
# Usage: bash .github/scripts/ralph.sh <issue-number> <issue-title> <branch> [slice-name]
set -euo pipefail

ISSUE_NUMBER="${1:?Usage: ralph.sh <issue-number> <issue-title> <branch> [slice-name]}"
ISSUE_TITLE="${2:?Usage: ralph.sh <issue-number> <issue-title> <branch> [slice-name]}"
BRANCH="${3:?Usage: ralph.sh <issue-number> <issue-title> <branch> [slice-name]}"
SLICE_FILTER="${4:-}"
MAX_AUTOPILOT_CONTINUES="${RALPH_MAX_AUTOPILOT_CONTINUES:-4}"

ISSUE_FILE="ISSUES-issue-${ISSUE_NUMBER}.md"
RALPH=".github/skills/ralph/RALPH.md"

[[ -f "$ISSUE_FILE" ]] || { echo "Error: $ISSUE_FILE not found"; exit 1; }
[[ -f "$RALPH"      ]] || { echo "Error: $RALPH not found";      exit 1; }

mapfile -t slices < <(grep "^## " "$ISSUE_FILE" | sed 's/^## //')
echo "Found ${#slices[@]} slice(s) in $ISSUE_FILE"

for slice in "${slices[@]}"; do
  [[ -n "$SLICE_FILTER" && "$slice" != "$SLICE_FILTER" ]] && { echo "Skipping: $slice"; continue; }
  echo ""
  echo "--- Slice: $slice ---"

  # Skip slices marked HITL
  if awk -v h="## $slice" '$0==h{f=1;next} f&&/^## /{exit} f' "$ISSUE_FILE" | grep -qw HITL; then
    echo "Skipping HITL slice: $slice"
    continue
  fi

  # Extract slice content and substitute template variables into RALPH.md
  tmp=$(mktemp /tmp/ralph-XXXXXX.md)
  python3 - "$RALPH" "$ISSUE_FILE" "$tmp" \
    "ISSUE_TITLE=$ISSUE_TITLE" "BRANCH=$BRANCH" "ISSUE_FILE=$ISSUE_FILE" \
    "SLICE=$slice" <<'PY'
import sys, re

ralph_path, issues_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
env = dict(kv.split('=', 1) for kv in sys.argv[4:])

with open(ralph_path) as f:
    template = f.read()
with open(issues_path) as f:
    issues = f.read()

m = re.search(rf'^## {re.escape(env["SLICE"])}\s*\n(.*?)(?=^## |\Z)', issues, re.M | re.S)
if not m:
  raise SystemExit(f"Error: slice '{env['SLICE']}' not found in {issues_path}")

env["SLICE_CONTEXT"] = f"## {env['SLICE']}\n{m.group(1).rstrip()}"

result = re.sub(r'\{\{(\w+)\}\}', lambda m: env.get(m.group(1), m.group(0)), template)

with open(out_path, 'w') as f:
    f.write(result)
PY

  output=$(copilot --autopilot --yolo --max-autopilot-continues "$MAX_AUTOPILOT_CONTINUES" -p "@file:${tmp}" 2>&1)
  rm -f "$tmp"
  echo "$output"

  [[ "$output" == *"COMPLETE"* ]] && { echo "COMPLETE: $slice"; break; }
done

echo "All slices processed."
