import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Workout } from '../models/workout';
import { WorkoutSet } from '../models/set';
import { STORAGE_ADAPTER } from './storage-adapter';

const STORAGE_KEY = 'gymtracker_workouts';

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  weightKg: number;
  date: string;
}

@Injectable({
  providedIn: 'root',
})
export class WorkoutService {
  private readonly storage = inject(STORAGE_ADAPTER);
  private readonly _workouts = signal<Workout[]>(this.load());
  readonly workouts = this._workouts.asReadonly();

  readonly sortedWorkouts = computed(() =>
    [...this._workouts()].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  );

  readonly recentWorkouts = computed(() => this.sortedWorkouts().slice(0, 5));

  readonly personalRecords = computed((): PersonalRecord[] => {
    const prs: Record<string, { weightKg: number; date: string; exerciseName: string }> = {};
    for (const workout of this._workouts()) {
      for (const ex of workout.exercises) {
        const maxSet = ex.sets.reduce(
          (best: WorkoutSet | null, s) => (!best || s.weightKg > best.weightKg ? s : best),
          null
        );
        if (maxSet) {
          const current = prs[ex.exerciseId];
          if (!current || maxSet.weightKg > current.weightKg) {
            prs[ex.exerciseId] = {
              weightKg: maxSet.weightKg,
              date: workout.date,
              exerciseName: ex.exerciseName,
            };
          }
        }
      }
    }
    return Object.entries(prs).map(([exerciseId, pr]) => ({ exerciseId, ...pr }));
  });

  progressForExercise(exerciseId: Signal<string>): Signal<{ date: string; maxWeightKg: number }[]> {
    return computed(() => {
      const id = exerciseId();
      if (!id) return [];
      return this._workouts()
        .filter(w => w.exercises.some(e => e.exerciseId === id))
        .map(w => {
          const ex = w.exercises.find(e => e.exerciseId === id)!;
          const maxWeight = Math.max(...ex.sets.map(s => s.weightKg));
          return { date: w.date, maxWeightKg: maxWeight };
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
  }

  private load(): Workout[] {
    return this.storage.get<Workout[]>(STORAGE_KEY) ?? [];
  }

  private save(workouts: Workout[]): void {
    this.storage.set(STORAGE_KEY, workouts);
  }

  addWorkout(workout: Omit<Workout, 'id'>): Workout {
    const newWorkout: Workout = { ...workout, id: `workout-${Date.now()}` };
    const updated = [...this._workouts(), newWorkout];
    this._workouts.set(updated);
    this.save(updated);
    return newWorkout;
  }

  deleteWorkout(id: string): void {
    const updated = this._workouts().filter(w => w.id !== id);
    this._workouts.set(updated);
    this.save(updated);
  }
}
