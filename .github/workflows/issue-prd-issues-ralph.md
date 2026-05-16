---
name: Issue PRD Issues Ralph
description: |
  Triage each issue as AFK or HITL. HITL asks questions and waits. AFK delivers
  directly (simple-task) or through PRD->ISSUES->RALPH (full-process), then opens
  a draft PR.
on:
  issues:
    types: [opened]
    lock-for-agent: true
  issue_comment:
    types: [created]

engine: copilot
strict: false

timeout-minutes: 60

permissions:
  contents: read
  issues: read
  pull-requests: read

network: defaults

tools:
  github:
    lockdown: false
    min-integrity: none

safe-outputs:
  add-labels:
    allowed:
      [
        afk,
        hitl,
        grilling-needed,
        grill-complete,
        autonomous,
        ready-for-review,
        needs-human-input,
        automated,
        simple-task,
        full-process,
      ]
  add-comment:
    max: 12
  create-pull-request:
    title-prefix: '[issue-automation] '
    labels: [automation, automated, ready-for-review]
    draft: true
---

# Issue Triage and Delivery (Compact)

Process issue #${{ github.event.issue.number }} using labels as state.

## Global Rules

- Keep scope limited to this issue.
- If blocked, post one status comment with blocker and stop.
- Do not rewrite git history.
- On issue_comment events, ignore comments authored by bots/agents; only human comments can advance state.

## Step 1: Classify and Label

Classify as:

- AFK: safe to implement without decisions
- HITL: requires decisions, clarification, or approval

Apply labels:

- AFK: add afk, autonomous; remove hitl, needs-human-input, grilling-needed
- HITL: add hitl, needs-human-input, grilling-needed; remove afk, autonomous, grill-complete
- AFK simple scope: add simple-task, remove full-process
- AFK non-simple scope: add full-process, remove simple-task

Post one triage comment: classification, reason, and next path.

## Step 2A: HITL Path (Question First)

When HITL:

- Do not implement and do not open PR.
- Ask one structured grilling comment based on .github/skills/grill-me/SKILL.md.
- Keep grilling-needed until all required answers are present.

Resume and proceed to Step 2B when any of the following occurs:

- A human comment provides all requested decisions.
- A human manually adds the `afk` or `autonomous` label to the issue.
- A human comment contains an explicit override such as "go ahead", "just do it", or "AFK".

When resuming:

- add grill-complete, autonomous
- remove grilling-needed, needs-human-input, hitl
- continue to Step 2B

## Step 2B: Autonomous Path

### Simple-task lane (label: simple-task)

- Skip .github/skills/to-prd/SKILL.md and .github/skills/to-issues/SKILL.md.
- Implement using RALPH autopilot: `npm run ralph -- ${{ github.event.issue.number }} "${{ github.event.issue.title }}" <branch>`
- Open draft PR with concise summary, tests run, and why heavy steps were skipped.
- Add automated and ready-for-review.
- Post one issue comment with PR link.

### Full-process lane (label: full-process)

- Run .github/skills/to-prd/SKILL.md -> PRD-issue-${{ github.event.issue.number }}.md
- Run .github/skills/to-issues/SKILL.md -> ISSUES-issue-${{ github.event.issue.number }}.md
- Ensure slices are vertical, ordered by dependency, and marked AFK/HITL with blocked-by links.
- Inspect every slice in ISSUES-issue-${{ github.event.issue.number }}.md:
  - **AFK slices**: run the RALPH loop immediately: `npm run ralph -- ${{ github.event.issue.number }} "${{ github.event.issue.title }}" <branch>`
    - The script (`.github/scripts/ralph.sh`) processes only AFK slices; HITL-marked slices are skipped automatically.
  - **HITL slices**: for each one, create a sub-issue of this issue with:
    - Title: `[Slice] <slice-name> (issue #${{ github.event.issue.number }})`
    - Body: the full slice content from ISSUES-issue-${{ github.event.issue.number }}.md plus a structured grilling comment (per .github/skills/grill-me/SKILL.md) identifying exactly what decision or information is needed to make this slice AFK.
    - Labels: `hitl`, `needs-human-input`, `grilling-needed`, `full-process`
    - Do NOT block the AFK slices from running while sub-issues are open.
- Open draft PR for the AFK work completed so far, noting which slices are pending sub-issues.
- Add ready-for-review and post one issue comment with PR link and a list of open sub-issues.

## Step 3: Sub-issue Resolution

This workflow also triggers when a sub-issue (created in Step 2B full-process) is resolved. Detect a sub-issue by checking for the `[Slice]` prefix in the issue title.

When a sub-issue transitions to AFK (human adds `afk`/`autonomous` label, or comments "go ahead" / "just do it" / "AFK"):

1. Update the corresponding slice in ISSUES-issue-`<parent-issue-number>`.md from HITL to AFK.
2. Extract the slice name from the sub-issue title (`[Slice] <slice-name> (issue #<N>)`).
3. Run RALPH for that slice only: `npm run ralph -- <parent-issue-number> "<parent-issue-title>" <branch> "<slice-name>"`
4. Post a comment on the sub-issue with the outcome, then close the sub-issue.
5. Post a comment on the parent issue noting the slice is complete.
6. If all slices are now AFK and done, update the draft PR description to reflect full completion.
