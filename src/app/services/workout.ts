import { Injectable, signal, computed } from '@angular/core';
import { Workout, WorkoutExercise } from '../models/workout';
import { WorkoutSet } from '../models/set';

const STORAGE_KEY = 'gymtracker_workouts';

@Injectable({
  providedIn: 'root',
})
export class WorkoutService {
  private readonly _workouts = signal<Workout[]>(this.load());
  readonly workouts = this._workouts.asReadonly();

  readonly recentWorkouts = computed(() =>
    [...this._workouts()]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  );

  private load(): Workout[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private save(workouts: Workout[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
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

  getPersonalRecords(): Record<string, { weightKg: number; date: string; exerciseName: string }> {
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
    return prs;
  }

  getProgressForExercise(exerciseId: string): { date: string; maxWeightKg: number }[] {
    return this._workouts()
      .filter(w => w.exercises.some(e => e.exerciseId === exerciseId))
      .map(w => {
        const ex = w.exercises.find(e => e.exerciseId === exerciseId)!;
        const maxWeight = Math.max(...ex.sets.map(s => s.weightKg));
        return { date: w.date, maxWeightKg: maxWeight };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}
