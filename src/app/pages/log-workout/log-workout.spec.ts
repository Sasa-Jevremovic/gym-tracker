import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { ExerciseService } from '../../services/exercise';
import { WorkoutService } from '../../services/workout';
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
});
