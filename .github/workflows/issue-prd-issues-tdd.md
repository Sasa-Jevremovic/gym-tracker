---
name: Issue PRD Issues TDD
description: |
  Triage each issue as AFK or HITL. HITL asks questions and waits. AFK delivers
  directly (simple-task) or through PRD->ISSUES->TDD (full-process), then opens
  a draft PR.
on:
  issues:
    types: [opened]
    lock-for-agent: true
  issue_comment:
    types: [created]

engine: copilot
strict: false

timeout-minutes: 10

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

Resume only when a human comment provides all requested decisions. Then:

- add grill-complete, autonomous
- remove grilling-needed, needs-human-input, hitl
- continue to Step 2B

## Step 2B: Autonomous Path

### Simple-task lane (label: simple-task)

- Skip .github/skills/to-prd/SKILL.md and .github/skills/to-issues/SKILL.md.
- Use .github/skills/tdd/SKILL.md only if risk is non-trivial.
- Implement minimum change and run targeted validation.
- Open draft PR with concise summary, tests run, and why heavy steps were skipped.
- Add automated and ready-for-review.
- Post one issue comment with PR link.

### Full-process lane (label: full-process)

- Run .github/skills/to-prd/SKILL.md -> PRD-issue-${{ github.event.issue.number }}.md
- Run .github/skills/to-issues/SKILL.md -> ISSUES-issue-${{ github.event.issue.number }}.md
- Run .github/skills/tdd/SKILL.md for implementation.
- Ensure slices are vertical, ordered by dependency, and marked AFK/HITL with blocked-by links.
- Open draft PR including testing evidence and unresolved assumptions.
- Add ready-for-review and post one issue comment with PR + artifact links.
