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
    mode: gh-proxy
    toolsets: [context, issues, pull_requests]

safe-outputs:
  add-labels:
    target: '*'
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
    max: 20
  remove-labels:
    target: '*'
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
    max: 20
  add-comment:
    target: '*'
    max: 20
  create-issue:
    title-prefix: '[Slice] '
    labels: [hitl, needs-human-input, grilling-needed, full-process]
    max: 20
  close-issue:
    target: '*'
    required-title-prefix: '[Slice] '
    max: 20
  link-sub-issue:
    max: 20
  create-pull-request:
    title-prefix: '[AI-Agent]: '
    labels: [automation, automated, ready-for-review]
    draft: true
    protected-files: fallback-to-issue
  update-pull-request:
    target: '*'
    body: true
    max: 1
---

# Issue Triage and Delivery

Aliases: `N` = issue number, `ISSUES` = `ISSUES-issue-N.md`, `BRANCH` = `issue-N`.

RALPH executor: `npm run ralph -- N "<title>" issue-N [slice-name]`.
Use `.github/skills/ralph/RALPH.md` as-is. Do not restate its implementation instructions here.
Prefer the configured safe-output tools over direct GitHub read or write tools.

Rules: scope to this issue; post one comment when blocked; no history rewrites; ignore bot comments on `issue_comment` events.

If no GitHub action is needed, you MUST call `noop` with a brief reason. Do not stop silently.

**Entry guard** (check before doing any work):

- On `issue_comment`: proceed only if the issue has at least one of `afk`, `hitl`, `grilling-needed`, `autonomous`, or title starts with `[Slice]`; otherwise call `noop` explaining that the issue is not enrolled for this workflow.
- On `issues.opened`: always proceed.

## Step 1: Classify and Label

| Classification   | Add                                            | Remove                                         |
| ---------------- | ---------------------------------------------- | ---------------------------------------------- |
| AFK              | `afk`, `autonomous`                            | `hitl`, `needs-human-input`, `grilling-needed` |
| HITL             | `hitl`, `needs-human-input`, `grilling-needed` | `afk`, `autonomous`, `grill-complete`          |
| simple scope     | `simple-task`                                  | `full-process`                                 |
| non-simple scope | `full-process`                                 | `simple-task`                                  |

Post one triage comment: classification, reason, next path.

Resume trigger for Steps 2A and 3: the human provides missing answers, adds `afk` or `autonomous`, or says "go ahead", "just do it", or "AFK". On resume: add `grill-complete`, `autonomous`; remove `grilling-needed`, `needs-human-input`, `hitl`.

## Step 2A: HITL Path

Do not implement. Post one grilling comment per .github/skills/grill-me/SKILL.md. Wait for resume trigger, then proceed to Step 2B.

## Step 2B: Autonomous Path

**Simple-task**: skip PRD and ISSUES generation. Pass the full issue body as `{{SLICE_CONTEXT}}`; omit `{{ISSUE_FILE}}`. Run RALPH. On `COMPLETE`, open a draft PR citing the `RALPH:` commits as evidence, add `automated` and `ready-for-review`, and post the PR link.

**Full-process**:

1. **Idempotency**: if `PRD-issue-N.md` already exists on `BRANCH`, skip steps 2–3 and go straight to step 4.
2. Run to-prd to create `PRD-issue-N.md`, then run to-issues to create `ISSUES` with dependency-ordered AFK or HITL slices. Commit both files to `BRANCH`.
3. **AFK slices**: run RALPH once per AFK slice, passing the slice body as `{{SLICE_CONTEXT}}` and `ISSUES` as `{{ISSUE_FILE}}`. `ralph.sh` skips HITL slices automatically. Wait for `COMPLETE`.
4. **HITL slices**: create one sub-issue per slice:
   - Title: `[Slice] <slice-name> (issue #N)`
   - Body: slice content from `ISSUES` + grilling questions (what is needed to make it AFK)
   - Labels: `hitl`, `needs-human-input`, `grilling-needed`, `full-process`

- Link each sub-issue to the parent issue

1. After all RALPH runs complete, open a draft PR linking the `RALPH:` commits as delivery evidence. Add `ready-for-review`. Post the PR link and any open sub-issues.

## Step 3: Sub-issue Resolution

Detect sub-issues by `[Slice]` title prefix. Parse parent issue number and slice name from title.

On resume trigger: update the slice in `ISSUES` to AFK, run RALPH with `"<slice-name>"`, and wait for `COMPLETE`. On success, post the `RALPH:` commit SHA as evidence, close the sub-issue, and notify the parent. On failure, reopen the sub-issue, re-add `grilling-needed`, post the blocker, and wait for another resume trigger.

If all slices are done: update the draft PR description to reflect full completion.
