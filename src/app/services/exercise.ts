import { Injectable, signal } from '@angular/core';
import { Exercise } from '../models/exercise';

const DEFAULT_EXERCISES: Exercise[] = [
  { id: 'bench-press', name: 'Bench Press', category: 'Chest', isCustom: false },
  { id: 'squat', name: 'Squat', category: 'Legs', isCustom: false },
  { id: 'deadlift', name: 'Deadlift', category: 'Back', isCustom: false },
  { id: 'overhead-press', name: 'Overhead Press', category: 'Shoulders', isCustom: false },
  { id: 'barbell-row', name: 'Barbell Row', category: 'Back', isCustom: false },
  { id: 'pull-up', name: 'Pull-Up', category: 'Back', isCustom: false },
  { id: 'dumbbell-curl', name: 'Dumbbell Curl', category: 'Arms', isCustom: false },
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', category: 'Arms', isCustom: false },
  { id: 'leg-press', name: 'Leg Press', category: 'Legs', isCustom: false },
  { id: 'lat-pulldown', name: 'Lat Pulldown', category: 'Back', isCustom: false },
  { id: 'incline-bench', name: 'Incline Bench Press', category: 'Chest', isCustom: false },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', category: 'Legs', isCustom: false },
];

const STORAGE_KEY = 'gymtracker_exercises';

@Injectable({
  providedIn: 'root',
})
export class ExerciseService {
  private readonly _exercises = signal<Exercise[]>(this.load());
  readonly exercises = this._exercises.asReadonly();

  private load(): Exercise[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    const custom: Exercise[] = stored ? JSON.parse(stored) : [];
    return [...DEFAULT_EXERCISES, ...custom];
  }

  addExercise(name: string, category: string): void {
    const newExercise: Exercise = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      category: category.trim(),
      isCustom: true,
    };
    const updated = [...this._exercises(), newExercise];
    this._exercises.set(updated);
    const custom = updated.filter(e => e.isCustom);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
  }

  deleteCustomExercise(id: string): void {
    const updated = this._exercises().filter(e => e.id !== id);
    this._exercises.set(updated);
    const custom = updated.filter(e => e.isCustom);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
  }
}
