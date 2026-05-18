---
name: Issue Automate
description: >-
  Listens for opened issues and auto-implements them AFK. Simple issues are
  implemented directly; complex issues go through PRD → tasks → implement.
  Ambiguous issues pause and post clarifying questions before proceeding.
on:
  issues:
    types: [opened]
    lock-for-agent: true
  issue_comment:
    types: [created]
    lock-for-agent: true

engine: copilot
strict: false

timeout-minutes: 20

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
    allowed: [afk, needs-human-input, ready-for-review, simple-task, complex-task, automated]
    max: 10
  remove-labels:
    target: '*'
    allowed: [afk, needs-human-input, ready-for-review, simple-task, complex-task, automated]
    max: 10
  add-comment:
    target: '*'
    max: 20
  create-pull-request:
    title-prefix: '[AI]: '
    labels: [automated, ready-for-review]
    draft: true
    protected-files: fallback-to-issue
  update-pull-request:
    target: '*'
    body: true
    max: 1
---

# Issue Auto-Implement

Vars: `N`=issue number, `BRANCH`=`AFK/issue-N`.

**Entry guard**:

- `issues.opened` → if issue already has the `afk` label (manually set by human), skip to **Section 2**. Otherwise go to **Section 1**.
- `issue_comment` → proceed only if the issue has `needs-human-input` label, else noop. → go to **Section 3**.

## 1. Ambiguity Check

Read the issue title and description. Decide autonomously:

- **Clear enough to implement** (requirements are specific, scope is well-defined, no critical unknowns) → add label `afk` → go to **Section 2**.
- **Too ambiguous** (missing key details, unclear scope, multiple valid interpretations that would lead to different implementations) → post **one comment** on the issue containing all blocking questions, grouped and numbered → add label `needs-human-input` → **stop**.

## 2. Classify & Branch

Create branch `BRANCH` from `main` (skip if exists).

Decide complexity based on the issue scope:

- **Simple** (single-concern, contained change, no PRD needed) → label `simple-task` → go to **Section 2A**.
- **Complex** (multi-concern, touches multiple features or layers, needs a PRD, but may still be implementable directly from that PRD) → label `complex-task` → go to **Section 2B**.

## 2A. Simple — Implement directly

Run implement skill → run review skill → open draft PR, label `ready-for-review`, comment PR link on the issue.

Implement: `.github/skills/implement-promt/SKILL.md`
Review: `.github/skills/review-promt/SKILL.md`

## 2B. Complex — PRD First, Tasks Only If Truly Needed

1. **PRD** (idempotent): `PRD-issue-N.md` absent → follow `.github/skills/to-prd/SKILL.MD`, commit to `BRANCH`.
2. Default to implementing from `PRD-issue-N.md`. Create `tasks-issue-N.md` only if the PRD requires multiple vertical slices, explicit sequencing, or dependency tracking.
3. **Tasks** (idempotent, conditional): only if step 2 requires task breakdown and `tasks-issue-N.md` is absent → follow `.github/skills/to-tasks/SKILL.MD`, commit to `BRANCH`.
4. If `tasks-issue-N.md` exists, implement all tasks from that file in order using the implement skill, respecting `Blocked by` dependencies. Otherwise, implement directly from `PRD-issue-N.md` using the implement skill.
5. Open draft PR, label `ready-for-review`, comment PR link on the issue.

Implement: `.github/skills/implement-promt/SKILL.md`
Review: `.github/skills/review-promt/SKILL.md`

## 3. Resume (issue_comment + needs-human-input)

A human has replied to the clarifying questions on the issue. Remove label `needs-human-input`.

Re-evaluate the issue title, description, and all comments (including the new answers):

- **Still ambiguous** → post a follow-up comment with any remaining blocking questions → re-add `needs-human-input` → **stop**.
- **Now clear** → add label `afk` → go to **Section 2**.
