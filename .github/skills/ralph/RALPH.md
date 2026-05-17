# RALPH Implementation Prompt

Fix issue: {{ISSUE_TITLE}}

The task content is pre-loaded in `## TASK` below. `{{ISSUE_FILE}}` is the local issue file when provided; use it only to check off acceptance criteria. If that file has a `## Parent` section referencing a local PRD, read that PRD too.

Only work on the issue specified.

Work on branch {{BRANCH}}. Make commits and run tests when done.

## TASK

{{SLICE_CONTEXT}}

## EXPLORATION

Read only the files needed for this task. Start from the most direct implementation surface, then check nearby tests or call sites if needed.

## EXECUTION

Use RGR (Red-Green-Refactor) when practical.

1. RED: add one focused failing test when behavior changes
2. GREEN: implement the smallest fix
3. REPEAT until done
4. REFACTOR only within scope

## FEEDBACK LOOPS

Run the narrowest useful validation after each substantive change. Before committing, run `npm run test`.

## COMMIT

Make a git commit. The commit message must:

1. Start with `RALPH:` prefix
2. Include task completed + PRD reference
3. Key decisions made
4. Files changed
5. Blockers or notes for next iteration

Keep it concise.

## THE ISSUE

If `{{ISSUE_FILE}}` is provided and the task is not complete, add a short note describing what was done and what remains.

Do not remove acceptance criteria checkboxes; check them off as each criterion is met.

Once complete, output `COMPLETE`.

## FINAL RULES

ONLY WORK ON A SINGLE TASK.
