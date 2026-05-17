## Problem Statement

People who repeat the same training split each week currently have to rebuild the same workout draft by hand every time they start a new session. In this app, completed workouts are persisted and viewable, but there is no reusable template concept that lets a user capture a finished workout structure and use it to start the next session faster.

## Solution

Allow a user to save any completed workout as a named workout template. When the user starts a new workout, they can choose one of their saved templates to pre-fill the workout draft with the same exercises and default set counts, while leaving all weights empty so the new session starts cleanly. Users can also manage their template library by viewing, renaming, and deleting templates. Templates are persisted in localStorage alongside workouts.

## User Stories

1. As a gym tracker user, I want to save a completed workout as a template, so that I can reuse the same structure next week.
2. As a gym tracker user, I want to give a template a clear custom name, so that I can distinguish upper-body, lower-body, and specialty sessions.
3. As a gym tracker user, I want to save a template directly from workout history, so that I can promote proven sessions without rebuilding them.
4. As a gym tracker user, I want templates to include the exercises and the number of sets from a completed workout, so that the next session mirrors the same plan.
5. As a gym tracker user, I want template-loaded sets to start with no weights, so that previous performance data is not copied into a new workout by mistake.
6. As a gym tracker user, I want template-loaded sets to start with editable default reps values, so that I can keep the draft structure but still adjust the plan as needed.
7. As a gym tracker user, I want to choose a template at the beginning of logging a workout, so that I can start with a filled draft instead of adding exercises one by one.
8. As a gym tracker user, I want to browse all saved templates in one place, so that I can understand what reusable sessions I already have.
9. As a gym tracker user, I want to rename a template, so that I can keep my library organized as my training plan changes.
10. As a gym tracker user, I want to delete templates I no longer use, so that stale plans do not clutter the picker.
11. As a gym tracker user, I want deleting a template to leave my completed workout history untouched, so that reuse management cannot destroy logged data.
12. As a gym tracker user, I want loading a template to affect only the current workout draft, so that my saved template remains reusable for future sessions.
13. As a gym tracker user, I want to edit a template-loaded draft after loading it, so that I can add or remove exercises for that specific day.
14. As a gym tracker user, I want to continue creating workouts manually without using templates, so that templates remain optional.
15. As a gym tracker user, I want templates to persist after page reloads, so that my saved plans survive browser restarts.
16. As a gym tracker user, I want the template list to load from the same local persistence model as workouts, so that the app remains fully offline-capable.
17. As a gym tracker user, I want template names to reject blank values, so that the template list remains understandable.
18. As a gym tracker user, I want duplicate template names to be handled predictably, so that I do not accidentally lose track of which template is which.
19. As a gym tracker user, I want a newly saved template to appear immediately in the picker, so that I can save from history and reuse it without reloading the app.
20. As a gym tracker user, I want the app to behave safely when no templates exist yet, so that empty-state flows remain clear.
21. As a gym tracker user, I want template management actions to be accessible from keyboard and screen readers, so that the feature remains usable across input modes.
22. As a gym tracker user, I want template operations to preserve exercise identity where possible, so that analytics and future features can continue to reason about exercise IDs.
23. As a gym tracker user, I want templates to tolerate historical workouts saved before templates existed, so that older data remains valid and reusable.
24. As a gym tracker user, I want saving a template from a workout with notes or split metadata to behave consistently, so that only the intended reusable planning fields are carried forward.

## Implementation Decisions

- Introduce a dedicated workout template domain model rather than overloading completed workouts. A template should be its own persisted entity with a stable identifier, user-provided name, optional source metadata, and an array of exercise defaults.
- Keep completed workouts and workout templates in separate localStorage collections. This preserves backward compatibility for existing workout data and avoids mixing reusable planning artifacts with immutable history records.
- Reuse the existing storage adapter abstraction for template persistence. Template storage should follow the same get/set JSON flow already used for workouts so the application stays storage-backend-agnostic at the service boundary.
- Add a focused template catalog service as the deep module for this feature. Its interface should encapsulate list, create-from-workout, rename, delete, and load-by-id behavior so components do not manipulate raw localStorage arrays directly.
- Model template exercises as exercise identity plus default set structure. The template should carry exercise ID, exercise name, and the number of sets to generate for a new draft. Per-set weights from historical workouts must not be persisted into the draft-loading path.
- Preserve reps defaults from the source workout when building a template-loaded draft. This keeps the template useful as a session plan while still honoring the requirement that weights start empty.
- Add a draft hydration method that can replace the current workout draft from a selected template in one operation. This keeps the log-workout page from manually rebuilding the draft exercise by exercise.
- Treat loading a template as a one-time copy into the mutable workout draft. Subsequent edits to the draft must not mutate the saved template.
- Expose template creation from the completed-workout surface, because the acceptance criteria require saving any completed workout as a named template. The likely interaction is a save-as-template action in workout history where a concrete completed workout is already available.
- Expose template selection at the top of the new-workout flow before or alongside manual exercise entry. The picker should work when the draft is empty and should define predictable behavior if the user already started entering exercises.
- If the current draft is non-empty when loading a template, use an explicit replace-draft interaction instead of merging silently. Replacing is simpler, easier to test, and less ambiguous than partial merge behavior.
- Enforce trimmed non-empty names for create and rename operations in the template catalog service so validation is centralized and not duplicated across components.
- Permit duplicate template names unless product constraints require uniqueness later. Duplicate names are acceptable if templates retain stable IDs and UI actions are scoped to concrete entries; this avoids unnecessary validation friction in the initial version.
- Keep template deletion irreversible but scoped only to the template entity. Source workouts remain unchanged because they are the system of record for history.
- Maintain backward compatibility by treating absence of template storage as an empty list. Existing users with only workouts in localStorage should not require migration to keep the app working.
- Prefer minimal UI expansion over a new route for the first version. Template management can live on existing history and log-workout surfaces unless the list becomes large enough to justify a dedicated management page later.

## Testing Decisions

- Good tests should verify observable behavior at service and page boundaries: persisted template data, draft prefill shape, validation outcomes, and destructive actions. They should avoid asserting local signal implementation details beyond the public behavior exposed by services and component methods.
- Add unit tests for the template catalog service covering create-from-workout, load from storage, rename, delete, and empty-storage behavior.
- Add unit tests for the workout draft hydration path covering template application, weight reset behavior, rep preservation, and replace-draft semantics.
- Add component tests for the log-workout flow that verify selecting a template pre-fills exercises and sets in the draft, and that saving the workout still uses the edited draft data.
- Add component tests for the history flow that verify a completed workout can be saved as a named template and that template-management actions update the visible list.
- Reuse the current testing style already present for workout persistence: localStorage-backed service tests that simulate reloads and assert persisted behavior rather than implementation details.
- Prior art exists in the current workout service tests, which already validate persistence, reload behavior, and backward compatibility for stored workout data. Template tests should mirror that style for consistency.

## Out of Scope

- Cloud sync or account-based template sharing.
- Importing templates from external files or exporting them.
- Versioning templates or tracking which workouts were created from which template.
- Auto-suggesting templates based on prior behavior.
- Split-specific template filtering, scheduling, or calendar planning.
- Editing template contents in place as a full template-builder experience beyond rename and delete.
- Carrying over prior workout notes, dates, or logged weights into new sessions.

## Further Notes

- The current codebase already separates immutable workout history from mutable workout draft state, which is a good fit for introducing template loading as a draft-seeding operation.
- The deepest reusable seam here is not UI code; it is the template catalog plus draft hydration behavior. If those interfaces are kept small and deterministic, the UI changes remain straightforward.
- The current persistence abstraction is sufficient for this feature. No infrastructure change is required beyond adding a new storage key and the service that owns it.
