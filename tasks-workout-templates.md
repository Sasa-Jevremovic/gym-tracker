# Workout Template Tasks

## WT-1 Save Completed Workout As Template

**Title**: Save completed workout as template

**Type**: AFK

**User stories covered**: 1, 2, 3, 15, 16, 17, 19, 23, 24

## Parent

PRD-workout-templates.md

## What to build

Add an end-to-end path that lets a user turn any completed workout into a named workout template from the workout history flow. The slice should persist templates separately from workouts, validate trimmed non-empty names, preserve exercise identity and rep defaults from the source workout, and make newly saved templates available immediately after creation and after reload.

## Acceptance criteria

- [ ] A completed workout can be saved as a named template from the history experience.
- [ ] Saving a template persists it in localStorage without changing the source workout record.
- [ ] Blank or whitespace-only template names are rejected with a user-visible validation outcome.
- [ ] Reloading the app restores saved templates from persistence.
- [ ] Tests cover template creation, persistence, and backward-compatible empty-storage behavior.

## Blocked by

None - can start immediately

## WT-2 Load Template Into New Workout

**Title**: Load template into new workout

**Type**: AFK

**User stories covered**: 4, 5, 6, 7, 12, 13, 14, 20, 22

## Parent

PRD-workout-templates.md

## What to build

Add a template picker to the new-workout flow that can seed the current workout draft from a saved template. Loading a template should replace the current draft in a predictable way, copy exercises and default set structure into the mutable session draft, preserve reps defaults, reset all weights for the new session, and leave the saved template unchanged for future reuse.

## Acceptance criteria

- [ ] Starting a new workout offers a way to choose from saved templates.
- [ ] Selecting a template pre-fills the workout draft with the template's exercises and set counts.
- [ ] Template-loaded sets preserve default reps and reset all weights to zero or empty-new-session values.
- [ ] Loading a template does not mutate the saved template and still allows the user to edit the draft normally before saving.
- [ ] Tests cover draft hydration, replace-draft behavior, and saving a workout after loading a template.

## Blocked by

- WT-1 Save completed workout as template

## WT-3 Manage Template Library

**Title**: Manage template library

**Type**: AFK

**User stories covered**: 8, 9, 10, 11, 18, 21

## Parent

PRD-workout-templates.md

## What to build

Add a template management view within the existing workout surfaces so users can browse saved templates, rename them, and delete them without affecting workout history. The slice should keep template actions scoped to concrete template entries, update the UI immediately after changes, tolerate duplicate names, and keep management interactions accessible from keyboard and screen readers.

## Acceptance criteria

- [ ] Users can see the current list of saved templates, including an understandable empty state when none exist.
- [ ] Users can rename a template and the change persists across reloads.
- [ ] Users can delete a template and the source workout history remains unchanged.
- [ ] Duplicate template names remain manageable because actions target stable template entries rather than names alone.
- [ ] Tests cover listing, renaming, deleting, and accessible management interactions.

## Blocked by

- WT-1 Save completed workout as template
