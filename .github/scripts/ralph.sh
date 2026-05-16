#!/usr/bin/env bash
# .github/scripts/ralph.sh
#
# Iterates each slice in ISSUES-issue-<N>.md, substitutes template variables
# into RALPH.md, and runs Copilot autopilot for each slice.
#
# Usage:
#   bash .github/scripts/ralph.sh <issue-number> <issue-title> <branch>

set -euo pipefail

ISSUE_NUMBER="${1:?Usage: ralph.sh <issue-number> <issue-title> <branch> [slice-name]}"
ISSUE_TITLE="${2:?Usage: ralph.sh <issue-number> <issue-title> <branch> [slice-name]}"
BRANCH="${3:?Usage: ralph.sh <issue-number> <issue-title> <branch> [slice-name]}"
SLICE_FILTER="${4:-}"  # optional: run only this named slice

ISSUES_FILE="ISSUES-issue-${ISSUE_NUMBER}.md"
RALPH_TEMPLATE=".github/skills/ralph/RALPH.md"

[[ -f "$ISSUES_FILE"    ]] || { echo "Error: $ISSUES_FILE not found";    exit 1; }
[[ -f "$RALPH_TEMPLATE" ]] || { echo "Error: $RALPH_TEMPLATE not found"; exit 1; }

export ISSUE_NUMBER ISSUE_TITLE BRANCH
export ISSUES_FILE RALPH_TEMPLATE

# Extract slice headings (## lines) from the ISSUES file
mapfile -t slices < <(grep "^## " "$ISSUES_FILE" | sed 's/^## //')

echo "Found ${#slices[@]} slice(s) in $ISSUES_FILE"

for slice in "${slices[@]}"; do
  echo ""
  echo "--- Slice: $slice ---"

  # If a specific slice was requested, skip all others
  if [[ -n "$SLICE_FILTER" && "$slice" != "$SLICE_FILTER" ]]; then
    echo "Skipping (not targeted): $slice"
    continue
  fi

  export CURRENT_SLICE="$slice"

  # Skip slices marked HITL in the ISSUES file
  is_hitl=$(python3 - <<'PY'
import os, re, sys
with open(os.environ["ISSUES_FILE"]) as f:
    issues_content = f.read()
current_slice = os.environ["CURRENT_SLICE"]
pattern = rf'^## {re.escape(current_slice)}\s*\n(.*?)(?=^## |\Z)'
match = re.search(pattern, issues_content, re.MULTILINE | re.DOTALL)
content = match.group(1) if match else ''
print('yes' if re.search(r'\bHITL\b', content) else 'no')
PY
  )
  if [[ "$is_hitl" == "yes" ]]; then
    echo "Skipping HITL slice (not yet AFK): $slice"
    continue
  fi

  tmp_prompt=$(mktemp /tmp/ralph-XXXXXX.md)
  export TMP_PROMPT="$tmp_prompt"

  # Extract only this slice's content (from its ## heading to the next ## heading)
  # as SLICE_CONTEXT — this is the "PRIOR RESEARCH" block in RALPH.md
  python3 - <<'PY'
import os, re

with open(os.environ["RALPH_TEMPLATE"]) as f:
    t = f.read()

with open(os.environ["ISSUES_FILE"]) as f:
    issues_content = f.read()

current_slice = os.environ["CURRENT_SLICE"]

# Extract the section for the current slice (## heading to next ## or EOF)
pattern = rf'^## {re.escape(current_slice)}\s*\n(.*?)(?=^## |\Z)'
match = re.search(pattern, issues_content, re.MULTILINE | re.DOTALL)
slice_context = f"## {current_slice}\n{match.group(1).rstrip()}" if match else issues_content

vars = dict(os.environ)
vars["SLICE_CONTEXT"] = slice_context

def replace_token(m):
    key = m.group(1)
    return vars.get(key, m.group(0))  # leave unknown tokens untouched

t = re.sub(r'\{\{(\w+)\}\}', replace_token, t)

with open(os.environ["TMP_PROMPT"], "w") as f:
    f.write(t)
PY

  output=$(copilot --autopilot --yolo --max-autopilot-continues 10 \
    -p "@file:${tmp_prompt}" 2>&1)
  rm -f "$tmp_prompt"

  echo "$output"

  if [[ "$output" == *"COMPLETE"* ]]; then
    echo "COMPLETE signal detected for slice: $slice"
    break
  fi
done

echo "All slices processed."
