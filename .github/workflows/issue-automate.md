---
name: Issue Automate
description: |
  Automatically implements GitHub issues with minimal human involvement.
  The model evaluates each issue's title and description to decide whether
  it is clear enough to proceed autonomously (AFK) or requires human
  clarification first. AFK issues are classified as simple (implement
  directly) or complex (PRD → tasks → implement). Ambiguous issues pause
  and post all clarifying questions in a single comment. No sub-issues
  are created at any point. A draft PR is opened after implementation.

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
  update-pull-request:
    target: '*'
    body: true
    max: 1
---

# Issue Auto-Implement

Vars: `N`=issue number, `BRANCH`=`AFK/issue-N`.
Executor: `copilot --autopilot --yolo --max-autopilot-continues 10 -p "@file:/tmp/task-tmp.md"`
Run a skill: substitute `{{ISSUE_NUMBER}}`=N, `{{ISSUE_TITLE}}`=title, `{{BRANCH}}`=BRANCH into the skill file → write `/tmp/task-tmp.md` → run executor → wait for `COMPLETE`.

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
- **Complex** (multi-concern, touches multiple features or layers, benefits from a breakdown) → label `complex-task` → go to **Section 2B**.

## 2A. Simple — Implement directly

Run implement skill → run review skill → open draft PR, label `ready-for-review`, comment PR link on the issue.

Implement: `.github/skills/implement-promt/SKILL.md`
Review: `.github/skills/review-promt/SKILL.md`

## 2B. Complex — PRD → Tasks → Implement

1. **PRD** (idempotent): `PRD-issue-N.md` absent → follow `.github/skills/to-prd/SKILL.MD`, commit to `BRANCH`.
2. **Tasks** (idempotent): `tasks-issue-N.md` absent → follow `.github/skills/to-tasks/SKILL.MD`, commit to `BRANCH`.
3. Implement all task slices in order using the implement skill, then run the review skill once.
4. Open draft PR, label `ready-for-review`, comment PR link on the issue.

Implement: `.github/skills/implement-promt/SKILL.md`
Review: `.github/skills/review-promt/SKILL.md`

## 3. Resume (issue_comment + needs-human-input)

A human has replied to the clarifying questions on the issue. Remove label `needs-human-input`.

Re-evaluate the issue title, description, and all comments (including the new answers):

- **Still ambiguous** → post a follow-up comment with any remaining blocking questions → re-add `needs-human-input` → **stop**.
- **Now clear** → add label `afk` → go to **Section 2**.
