import { Injectable, computed, inject, signal } from '@angular/core';
import { Exercise } from '../models/exercise';
import { STORAGE_ADAPTER } from './storage-adapter';

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
const FAVORITES_KEY = 'gymtracker_favorite_exercise_ids';

@Injectable({
  providedIn: 'root',
})
export class ExerciseService {
  private readonly storage = inject(STORAGE_ADAPTER);
  private readonly _exercises = signal<Exercise[]>(this.load());
  private readonly _favoriteIds = signal<Set<string>>(this.loadFavorites());

  readonly exercises = this._exercises.asReadonly();
  readonly favoriteIds = this._favoriteIds.asReadonly();

  readonly sortedExercises = computed(() => {
    const favIds = this._favoriteIds();
    const all = this._exercises();
    const favorites = all.filter(e => favIds.has(e.id));
    const rest = all.filter(e => !favIds.has(e.id));
    return { favorites, rest };
  });

  private load(): Exercise[] {
    const custom = this.storage.get<Exercise[]>(STORAGE_KEY) ?? [];
    return [...DEFAULT_EXERCISES, ...custom];
  }

  private loadFavorites(): Set<string> {
    const ids = this.storage.get<string[]>(FAVORITES_KEY) ?? [];
    return new Set(ids);
  }

  isFavorite(id: string): boolean {
    return this._favoriteIds().has(id);
  }

  toggleFavorite(id: string): void {
    const current = new Set(this._favoriteIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this._favoriteIds.set(current);
    this.storage.set(FAVORITES_KEY, [...current]);
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
    this.storage.set(STORAGE_KEY, updated.filter(e => e.isCustom));
  }

  deleteCustomExercise(id: string): void {
    const updated = this._exercises().filter(e => e.id !== id);
    this._exercises.set(updated);
    this.storage.set(STORAGE_KEY, updated.filter(e => e.isCustom));
  }
}
