import { TestBed } from '@angular/core/testing';
import { Workout } from '../models/workout';
import { WorkoutService } from './workout';

describe('WorkoutService - Split Support', () => {
  let service: WorkoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WorkoutService],
    });
    service = TestBed.inject(WorkoutService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Tracer Bullet: Basic split persistence', () => {
    it('should save and load a workout with a split', () => {
      const workout = service.addWorkout({
        date: '2025-01-01',
        notes: 'Upper day',
        exercises: [],
        split: 'Upper',
      });

      expect(workout.split).toBe('Upper');

      // Create a new service instance to simulate page reload
      const newService = TestBed.inject(WorkoutService);
      const loaded = newService.workouts()[0];
      expect(loaded.split).toBe('Upper');
    });

    it('should save and load a workout without a split', () => {
      const workout = service.addWorkout({
        date: '2025-01-01',
        notes: 'Unplanned workout',
        exercises: [],
      });

      expect(workout.split).toBeUndefined();

      // Create a new service instance to simulate page reload
      const newService = TestBed.inject(WorkoutService);
      const loaded = newService.workouts()[0];
      expect(loaded.split).toBeUndefined();
    });
  });

  describe('Backward compatibility: Historical workouts without split', () => {
    it('should load workouts stored without split metadata', () => {
      // Clear existing service
      localStorage.clear();

      // Simulate a workout stored in old format (without split)
      const oldFormatWorkout: Workout = {
        id: 'old-workout-1',
        date: '2024-01-01',
        notes: 'Legacy workout',
        exercises: [],
      };

      localStorage.setItem('gymtracker_workouts', JSON.stringify([oldFormatWorkout]));

      // Recreate TestBed to force fresh service initialization
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [WorkoutService],
      });

      const newService = TestBed.inject(WorkoutService);
      const loaded = newService.workouts()[0];

      expect(loaded.id).toBe('old-workout-1');
      expect(loaded.split).toBeUndefined();
      expect(loaded.exercises).toEqual([]);
    });
  });
});
