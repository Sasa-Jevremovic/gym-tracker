import { WorkoutDraft } from './workout-draft';
import { WorkoutTemplate } from '../models/workout-template';

const makeTemplate = (overrides: Partial<WorkoutTemplate> = {}): WorkoutTemplate => ({
  id: 'template-1',
  name: 'Upper A',
  exercises: [
    {
      exerciseId: 'bench-press',
      exerciseName: 'Bench Press',
      sets: [{ reps: 10 }, { reps: 8 }],
    },
    {
      exerciseId: 'overhead-press',
      exerciseName: 'Overhead Press',
      sets: [{ reps: 12 }],
    },
  ],
  createdAt: '2025-01-01T00:00:00.000Z',
  ...overrides,
});

describe('WorkoutDraft.loadFromTemplate', () => {
  let draft: WorkoutDraft;

  beforeEach(() => {
    draft = new WorkoutDraft();
  });

  it('pre-fills exercises from the template', () => {
    draft.loadFromTemplate(makeTemplate());

    const exercises = draft.exercises();
    expect(exercises).toHaveLength(2);
    expect(exercises[0].exerciseId).toBe('bench-press');
    expect(exercises[1].exerciseId).toBe('overhead-press');
  });

  it('preserves exercise names from the template', () => {
    draft.loadFromTemplate(makeTemplate());
    expect(draft.exercises()[0].exerciseName).toBe('Bench Press');
  });

  it('preserves default reps from the template', () => {
    draft.loadFromTemplate(makeTemplate());
    const sets = draft.exercises()[0].sets;
    expect(sets[0].reps).toBe(10);
    expect(sets[1].reps).toBe(8);
  });

  it('resets all weights to zero', () => {
    draft.loadFromTemplate(makeTemplate());
    for (const ex of draft.exercises()) {
      for (const set of ex.sets) {
        expect(set.weightKg).toBe(0);
      }
    }
  });

  it('replaces an existing draft completely', () => {
    draft.exercises.set([
      {
        exerciseId: 'squat',
        exerciseName: 'Squat',
        sets: [{ reps: 5, weightKg: 100 }],
      },
    ]);

    draft.loadFromTemplate(makeTemplate());

    const ids = draft.exercises().map(e => e.exerciseId);
    expect(ids).not.toContain('squat');
    expect(ids).toContain('bench-press');
  });

  it('does not mutate the original template', () => {
    const template = makeTemplate();
    const originalSets = JSON.parse(JSON.stringify(template.exercises[0].sets));

    draft.loadFromTemplate(template);
    // Mutate the draft set
    draft.updateSet('bench-press', 0, 'weightKg', 999);

    expect(template.exercises[0].sets).toEqual(originalSets);
  });

  it('generates sets with correct count from template', () => {
    draft.loadFromTemplate(makeTemplate());
    expect(draft.exercises()[0].sets).toHaveLength(2);
    expect(draft.exercises()[1].sets).toHaveLength(1);
  });

  it('allows saving a workout after loading a template and editing', () => {
    draft.loadFromTemplate(makeTemplate());
    draft.updateSet('bench-press', 0, 'reps', 10);
    draft.updateSet('bench-press', 0, 'weightKg', 80);

    expect(draft.canSave()).toBe(true);
    expect(draft.validExercises()[0].sets[0].weightKg).toBe(80);
  });
});
