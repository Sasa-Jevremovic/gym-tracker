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

  readonly currentStreak = computed(() => this.calcCurrentStreak(this._workouts()));

  readonly longestStreak = computed(() => this.calcLongestStreak(this._workouts()));

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

  private uniqueWorkoutDays(workouts: Workout[]): string[] {
    const days = new Set(workouts.map(w => w.date.slice(0, 10)));
    return [...days].sort();
  }

  private calcCurrentStreak(workouts: Workout[]): number {
    const days = this.uniqueWorkoutDays(workouts);
    if (days.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);
    const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().slice(0, 10);

    const lastDay = days[days.length - 1];
    if (lastDay !== todayStr && lastDay !== yesterdayStr) return 0;

    let streak = 1;
    let cursor = new Date(lastDay);
    for (let i = days.length - 2; i >= 0; i--) {
      const prev = new Date(cursor.getTime() - 86400000).toISOString().slice(0, 10);
      if (days[i] === prev) {
        streak++;
        cursor = new Date(days[i]);
      } else {
        break;
      }
    }
    return streak;
  }

  private calcLongestStreak(workouts: Workout[]): number {
    const days = this.uniqueWorkoutDays(workouts);
    if (days.length === 0) return 0;

    let longest = 1;
    let current = 1;
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i - 1]);
      const curr = new Date(days[i]);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) {
        current++;
        if (current > longest) longest = current;
      } else {
        current = 1;
      }
    }
    return longest;
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
