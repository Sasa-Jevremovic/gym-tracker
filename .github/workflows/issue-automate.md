---
name: Auto-Implement Issues
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
  reaction: eyes
  status-comment: true

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

Handle issue #${{ github.event.issue.number }} in `${{ github.repository }}`.
Branch: AFK/issue-${{ github.event.issue.number }}.
Use the sanitized activation text as the primary source of truth.

## Context

${{ steps.sanitized.outputs.text }}

{{#if github.event.comment.id}}

## Resume

Triggered by a new comment.
Re-evaluate the issue body and comment thread before resuming.
{{/if}}

## Rules

- Be deterministic and keep the scope tight.
- If the issue is ambiguous, ask one concise numbered question list, add `needs-human-input`, and stop.
- Reuse existing PRD or tasks files if they already exist.
- Keep labels consistent: never leave both `simple-task` and `complex-task` on the issue.
- Do not finish until labels are correct and the issue has a draft PR link.

## Skills

Available skills:

- PRD: `.github/skills/to-prd/SKILL.MD`
- Tasks: `.github/skills/to-tasks/SKILL.MD`
- Implement: `.github/skills/implement-prompt/SKILL.md`
- Review: `.github/skills/review-prompt/SKILL.md`

Skill contract:

- Always pass the issue number, branch, sanitized context, and the current source-of-truth artifact.
- Only ask a skill to handle one task at a time.
- After a skill finishes, resume this workflow at the next step.
- Review works on the current diff, preserves behavior, and only makes safe refinements. In the complex path it may also fix blocking review findings.

## Entry Guard

- `issues.opened` + label `afk` -> Section 2. Otherwise Section 1.
- `issue_comment` + label `needs-human-input` -> Section 3. Otherwise noop.

## 1. Ambiguity Check

Ambiguous if acceptance criteria are missing, scope is unclear, expected output is unspecified, or the request conflicts with existing code or decisions without explanation.

- Clear -> add `afk`, then Section 2.
- Ambiguous -> post numbered blocking questions, add `needs-human-input`, then stop.

If `needs-human-input` is older than 7 days with no reply, post a blocked comment and stop.

## 2. Classify & Branch

Create `AFK/issue-${{ github.event.issue.number }}` from `main` if it does not exist.

Classify as:

- `Simple`: one narrow change, one area, no planning artifact needed.
- `Complex`: multiple areas, ordered slices, or explicit planning needed.

Normalize labels first:

- `Simple` -> add `simple-task`, remove `complex-task`.
- `Complex` -> add `complex-task`, remove `simple-task`.

- Simple -> max continues 5, then Section 2A.
- Complex -> max continues 20, then Section 2B.

### 2A. Simple

1. Invoke the Implement skill with the issue itself as the source of truth.
2. Tell it to finish the issue on the current branch and stop after implementation.
3. Invoke the Review skill against the resulting diff.
4. Then go to Section 2C.

### 2B. Complex

1. Use the PRD skill to create or update `PRD-issue-${{ github.event.issue.number }}.md` from the issue.
2. Use the Tasks skill to create or update `tasks-issue-${{ github.event.issue.number }}.md` from the `PRD-issue-${{ github.event.issue.number }}.md`.
3. Choose one unblocked task.
4. Invoke the Implement skill with that task as the source of truth.
5. Tell it to complete only that task, then stop.
6. Repeat steps 3 to 5 until all tasks are complete.
7. Invoke the Review skill against the final diff.
8. Then go to Section 2C.

### 2C. Finalize

1. Open a draft PR.
2. Add `ready-for-review`.
3. Comment the draft PR link on the issue.

## 3. Resume

Remove `needs-human-input`. Re-evaluate the issue and all comments.

- If classification changes, remove the old `simple-task` or `complex-task` label before continuing.
- Keep `afk` only if the issue is ready to continue automatically.

- Still ambiguous -> post remaining questions, re-add `needs-human-input`, and stop.
- Clear -> add `afk`, then Section 2.
