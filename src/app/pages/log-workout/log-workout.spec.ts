import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { ExerciseService } from '../../services/exercise';
import { WorkoutService } from '../../services/workout';
import { WorkoutTemplateService } from '../../services/workout-template';
import { LogWorkout } from './log-workout';

describe('LogWorkout - Split Selection', () => {
  let component: LogWorkout;
  let fixture: ComponentFixture<LogWorkout>;
  let workoutService: WorkoutService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogWorkout, FormsModule],
      providers: [
        WorkoutService,
        ExerciseService,
        WorkoutTemplateService,
        {
          provide: Router,
          useValue: { navigate: vi.fn() },
        },
      ],
    }).compileComponents();

    localStorage.clear();
    fixture = TestBed.createComponent(LogWorkout);
    component = fixture.componentInstance;
    workoutService = TestBed.inject(WorkoutService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Tracer Bullet: Split selection and save', () => {
    it('should save workout with selected split', () => {
      // Set split
      component.split = 'Upper';

      // Add an exercise with a set
      component.workoutExercises.set([
        {
          exerciseId: 'bench',
          exerciseName: 'Bench Press',
          sets: [{ reps: 10, weightKg: 80 }],
        },
      ]);

      component.saveWorkout();

      const savedWorkout = workoutService.workouts()[0];
      expect(savedWorkout.split).toBe('Upper');
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should save workout without split when split not selected', () => {
      // Don't set split (leave as empty string)
      component.split = '';

      // Add an exercise with a set
      component.workoutExercises.set([
        {
          exerciseId: 'bench',
          exerciseName: 'Bench Press',
          sets: [{ reps: 10, weightKg: 80 }],
        },
      ]);

      component.saveWorkout();

      const savedWorkout = workoutService.workouts()[0];
      expect(savedWorkout.split).toBeUndefined();
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('Existing save behavior preserved', () => {
    it('should not save workout without at least one set with reps > 0', () => {
      component.split = 'Upper';

      // Add an exercise with no reps
      component.workoutExercises.set([
        {
          exerciseId: 'bench',
          exerciseName: 'Bench Press',
          sets: [{ reps: 0, weightKg: 80 }],
        },
      ]);

      component.saveWorkout();

      expect(workoutService.workouts().length).toBe(0);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should have canSave false when no exercises with reps', () => {
      component.workoutExercises.set([
        {
          exerciseId: 'bench',
          exerciseName: 'Bench Press',
          sets: [{ reps: 0, weightKg: 80 }],
        },
      ]);

      expect(component.canSave).toBe(false);
    });

    it('should have canSave true when at least one set has reps > 0', () => {
      component.workoutExercises.set([
        {
          exerciseId: 'bench',
          exerciseName: 'Bench Press',
          sets: [{ reps: 10, weightKg: 80 }],
        },
      ]);

      expect(component.canSave).toBe(true);
    });
  });

  describe('Template loading (WT-2)', () => {
    it('loads a template into the draft', () => {
      const templateService = TestBed.inject(WorkoutTemplateService);
      const workout = workoutService.addWorkout({
        date: '2025-01-01',
        notes: '',
        exercises: [
          {
            exerciseId: 'squat',
            exerciseName: 'Squat',
            sets: [{ reps: 5, weightKg: 100 }],
          },
        ],
      });
      templateService.createFromWorkout(workout, 'Leg Day');
      const template = templateService.templates()[0];

      component.selectedTemplateId.set(template.id);
      component.loadTemplate();

      const exercises = component.workoutExercises();
      expect(exercises).toHaveLength(1);
      expect(exercises[0].exerciseId).toBe('squat');
    });

    it('resets weights to zero when loading from template', () => {
      const templateService = TestBed.inject(WorkoutTemplateService);
      const workout = workoutService.addWorkout({
        date: '2025-01-01',
        notes: '',
        exercises: [
          {
            exerciseId: 'deadlift',
            exerciseName: 'Deadlift',
            sets: [{ reps: 5, weightKg: 150 }],
          },
        ],
      });
      templateService.createFromWorkout(workout, 'Pull Day');
      const template = templateService.templates()[0];

      component.selectedTemplateId.set(template.id);
      component.loadTemplate();

      expect(component.workoutExercises()[0].sets[0].weightKg).toBe(0);
    });

    it('preserves reps defaults from template', () => {
      const templateService = TestBed.inject(WorkoutTemplateService);
      const workout = workoutService.addWorkout({
        date: '2025-01-01',
        notes: '',
        exercises: [
          {
            exerciseId: 'bench-press',
            exerciseName: 'Bench Press',
            sets: [{ reps: 8, weightKg: 80 }, { reps: 6, weightKg: 90 }],
          },
        ],
      });
      templateService.createFromWorkout(workout, 'Upper Day');
      const template = templateService.templates()[0];

      component.selectedTemplateId.set(template.id);
      component.loadTemplate();

      const sets = component.workoutExercises()[0].sets;
      expect(sets[0].reps).toBe(8);
      expect(sets[1].reps).toBe(6);
    });

    it('allows saving the workout after loading a template', () => {
      const templateService = TestBed.inject(WorkoutTemplateService);
      const workout = workoutService.addWorkout({
        date: '2025-01-01',
        notes: '',
        exercises: [
          {
            exerciseId: 'squat',
            exerciseName: 'Squat',
            sets: [{ reps: 5, weightKg: 100 }],
          },
        ],
      });
      templateService.createFromWorkout(workout, 'Leg Day');
      const template = templateService.templates()[0];

      component.selectedTemplateId.set(template.id);
      component.loadTemplate();

      // Edit the draft - add weight
      component.draft.updateSet('squat', 0, 'weightKg', 120);
      component.saveWorkout();

      const saved = workoutService.workouts().find(w => w.date === component.date);
      expect(saved).toBeDefined();
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('does not mutate the saved template when loading', () => {
      const templateService = TestBed.inject(WorkoutTemplateService);
      const workout = workoutService.addWorkout({
        date: '2025-01-01',
        notes: '',
        exercises: [
          {
            exerciseId: 'squat',
            exerciseName: 'Squat',
            sets: [{ reps: 5, weightKg: 100 }],
          },
        ],
      });
      templateService.createFromWorkout(workout, 'Leg Day');
      const template = templateService.templates()[0];

      component.selectedTemplateId.set(template.id);
      component.loadTemplate();
      component.draft.updateSet('squat', 0, 'weightKg', 999);

      // Template should still have original reps, no weight
      expect(templateService.templates()[0].exercises[0].sets[0]).toEqual({ reps: 5 });
    });
  });
});
