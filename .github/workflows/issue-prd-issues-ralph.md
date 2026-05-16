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

timeout-minutes: 30

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
    max: 20
  create-pull-request:
    title-prefix: '[AI-Agent]: '
    labels: [automation, automated, ready-for-review]
    allowed-files:
      - package-lock.json
      - package.json
    draft: true
    protected-files: fallback-to-issue
---

# Issue Triage and Delivery

Aliases: `N` = issue number, `ISSUES` = `ISSUES-issue-N.md`, `BRANCH` = `issue-N`.

RALPH executor: `npm run ralph -- N "<title>" issue-N [slice-name]`
— runs `.github/skills/ralph/RALPH.md` as an autopilot prompt per slice, injecting the slice content as `{{SLICE_CONTEXT}}` and the path to `ISSUES` as `{{ISSUE_FILE}}` (used to check off acceptance criteria). Runs RGR/TDD, commits with `RALPH:` prefix, and signals `COMPLETE` when done. Do not re-describe these steps in this workflow.

Rules: scope to this issue; post one comment when blocked; no history rewrites; ignore bot comments on `issue_comment` events.

**Entry guard** (check before doing any work):

- On `issue_comment`: proceed only if the issue has at least one of `afk`, `hitl`, `grilling-needed`, `autonomous`, or title starts with `[Slice]`; otherwise stop silently.
- On `issues.opened`: always proceed.

## Step 1: Classify and Label

| Classification   | Add                                            | Remove                                         |
| ---------------- | ---------------------------------------------- | ---------------------------------------------- |
| AFK              | `afk`, `autonomous`                            | `hitl`, `needs-human-input`, `grilling-needed` |
| HITL             | `hitl`, `needs-human-input`, `grilling-needed` | `afk`, `autonomous`, `grill-complete`          |
| simple scope     | `simple-task`                                  | `full-process`                                 |
| non-simple scope | `full-process`                                 | `simple-task`                                  |

Post one triage comment: classification, reason, next path.

**AFK-to-HITL resume trigger** (used in Steps 2A and 3): human provides required answers, adds `afk`/`autonomous`, or writes "go ahead" / "just do it" / "AFK". On resume: add `grill-complete`, `autonomous`; remove `grilling-needed`, `needs-human-input`, `hitl`.

## Step 2A: HITL Path

Do not implement. Post one grilling comment per .github/skills/grill-me/SKILL.md. Wait for resume trigger, then proceed to Step 2B.

## Step 2B: Autonomous Path

**Simple-task**: skip PRD/ISSUES skills. Pass the full issue body as `{{SLICE_CONTEXT}}`; no `{{ISSUE_FILE}}` is used. Run RALPH. Once RALPH signals `COMPLETE`, open draft PR citing `RALPH:` commits as evidence. Add `automated`, `ready-for-review`. Post PR link.

**Full-process**:

1. **Idempotency**: if `PRD-issue-N.md` already exists on `BRANCH`, skip steps 2–3 and go straight to step 4.
2. Run to-prd skill → `PRD-issue-N.md`; run to-issues skill → `ISSUES` (vertical slices, dependency-ordered, each marked AFK/HITL). Commit both to `BRANCH`.
3. **AFK slices**: run RALPH once per AFK slice — pass each slice's body as `{{SLICE_CONTEXT}}` and `ISSUES` path as `{{ISSUE_FILE}}`; HITL-marked slices are skipped by `ralph.sh` automatically. Wait for `COMPLETE`.
4. **HITL slices**: create one sub-issue per slice:
   - Title: `[Slice] <slice-name> (issue #N)`
   - Body: slice content from `ISSUES` + grilling questions (what is needed to make it AFK)
   - Labels: `hitl`, `needs-human-input`, `grilling-needed`, `full-process`
5. After all RALPH runs complete: open draft PR linking the `RALPH:` commits as delivery evidence. Add `ready-for-review`. Post PR link + list of open sub-issues (if any).

## Step 3: Sub-issue Resolution

Detect sub-issues by `[Slice]` title prefix. Parse parent issue number and slice name from title.

**On resume trigger**: update slice in `ISSUES` to AFK, run RALPH with `"<slice-name>"` (slice content as `{{SLICE_CONTEXT}}`), wait for `COMPLETE`. On success: post the `RALPH:` commit SHA as evidence, close sub-issue, notify parent. On failure: reopen sub-issue, re-add `grilling-needed`, post what blocked RALPH, wait for new resume trigger.

If all slices are done: update the draft PR description to reflect full completion.
