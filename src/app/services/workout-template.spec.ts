import { TestBed } from '@angular/core/testing';
import { Workout } from '../models/workout';
import { WorkoutTemplateService } from './workout-template';

const STORAGE_KEY = 'gymtracker_templates';

const makeWorkout = (overrides: Partial<Workout> = {}): Workout => ({
  id: 'w1',
  date: '2025-01-01',
  notes: '',
  exercises: [
    {
      exerciseId: 'bench-press',
      exerciseName: 'Bench Press',
      sets: [
        { reps: 10, weightKg: 80 },
        { reps: 8, weightKg: 85 },
      ],
    },
  ],
  ...overrides,
});

describe('WorkoutTemplateService', () => {
  let service: WorkoutTemplateService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [WorkoutTemplateService] });
    service = TestBed.inject(WorkoutTemplateService);
  });

  afterEach(() => localStorage.clear());

  describe('Empty storage behavior', () => {
    it('starts with an empty template list when no data is stored', () => {
      expect(service.templates()).toEqual([]);
    });
  });

  describe('createFromWorkout', () => {
    it('creates a template with the given name', () => {
      const result = service.createFromWorkout(makeWorkout(), 'Upper A');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Upper A');
    });

    it('strips weights from sets and keeps reps', () => {
      service.createFromWorkout(makeWorkout(), 'Upper A');
      const template = service.templates()[0];
      expect(template.exercises[0].sets).toEqual([{ reps: 10 }, { reps: 8 }]);
    });

    it('preserves exercise identity (id and name)', () => {
      service.createFromWorkout(makeWorkout(), 'Upper A');
      const ex = service.templates()[0].exercises[0];
      expect(ex.exerciseId).toBe('bench-press');
      expect(ex.exerciseName).toBe('Bench Press');
    });

    it('stores sourceWorkoutId', () => {
      service.createFromWorkout(makeWorkout({ id: 'w-42' }), 'Upper A');
      expect(service.templates()[0].sourceWorkoutId).toBe('w-42');
    });

    it('rejects blank names and returns null', () => {
      expect(service.createFromWorkout(makeWorkout(), '')).toBeNull();
      expect(service.createFromWorkout(makeWorkout(), '   ')).toBeNull();
      expect(service.templates().length).toBe(0);
    });

    it('does not mutate the source workout', () => {
      const workout = makeWorkout();
      const originalExercises = JSON.parse(JSON.stringify(workout.exercises));
      service.createFromWorkout(workout, 'Upper A');
      expect(workout.exercises).toEqual(originalExercises);
    });

    it('persists to localStorage', () => {
      service.createFromWorkout(makeWorkout(), 'Upper A');
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe('Upper A');
    });

    it('allows duplicate template names', () => {
      service.createFromWorkout(makeWorkout(), 'Upper A');
      service.createFromWorkout(makeWorkout(), 'Upper A');
      expect(service.templates()).toHaveLength(2);
    });
  });

  describe('Persistence / reload behavior', () => {
    it('restores templates after simulated reload', () => {
      service.createFromWorkout(makeWorkout(), 'My Template');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [WorkoutTemplateService] });
      const newService = TestBed.inject(WorkoutTemplateService);

      expect(newService.templates()).toHaveLength(1);
      expect(newService.templates()[0].name).toBe('My Template');
    });

    it('returns empty list when storage key is absent', () => {
      localStorage.removeItem(STORAGE_KEY);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [WorkoutTemplateService] });
      const newService = TestBed.inject(WorkoutTemplateService);

      expect(newService.templates()).toEqual([]);
    });
  });

  describe('rename', () => {
    it('renames a template and persists the change', () => {
      service.createFromWorkout(makeWorkout(), 'Old Name');
      const id = service.templates()[0].id;

      const success = service.rename(id, 'New Name');

      expect(success).toBe(true);
      expect(service.templates()[0].name).toBe('New Name');

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored[0].name).toBe('New Name');
    });

    it('rejects blank rename values', () => {
      service.createFromWorkout(makeWorkout(), 'Old Name');
      const id = service.templates()[0].id;

      expect(service.rename(id, '')).toBe(false);
      expect(service.rename(id, '   ')).toBe(false);
      expect(service.templates()[0].name).toBe('Old Name');
    });

    it('rename persists across simulated reload', () => {
      service.createFromWorkout(makeWorkout(), 'Original');
      const id = service.templates()[0].id;
      service.rename(id, 'Renamed');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [WorkoutTemplateService] });
      const newService = TestBed.inject(WorkoutTemplateService);

      expect(newService.templates()[0].name).toBe('Renamed');
    });
  });

  describe('delete', () => {
    it('removes the template from the list and localStorage', () => {
      service.createFromWorkout(makeWorkout(), 'To Delete');
      const id = service.templates()[0].id;

      service.delete(id);

      expect(service.templates()).toHaveLength(0);
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored).toHaveLength(0);
    });

    it('only deletes the targeted template', () => {
      service.createFromWorkout(makeWorkout(), 'Keep Me');
      service.createFromWorkout(makeWorkout(), 'Delete Me');
      const deleteId = service.templates()[1].id;

      service.delete(deleteId);

      expect(service.templates()).toHaveLength(1);
      expect(service.templates()[0].name).toBe('Keep Me');
    });
  });

  describe('getById', () => {
    it('returns the template with the given id', () => {
      service.createFromWorkout(makeWorkout(), 'Find Me');
      const id = service.templates()[0].id;
      expect(service.getById(id)?.name).toBe('Find Me');
    });

    it('returns undefined for unknown id', () => {
      expect(service.getById('nonexistent')).toBeUndefined();
    });
  });
});
