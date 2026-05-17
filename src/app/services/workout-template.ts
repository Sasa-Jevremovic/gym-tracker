import { Injectable, inject, signal } from '@angular/core';
import { Workout } from '../models/workout';
import { WorkoutTemplate } from '../models/workout-template';
import { STORAGE_ADAPTER } from './storage-adapter';

const STORAGE_KEY = 'gymtracker_templates';
let _idCounter = 0;

@Injectable({
  providedIn: 'root',
})
export class WorkoutTemplateService {
  private readonly storage = inject(STORAGE_ADAPTER);
  private readonly _templates = signal<WorkoutTemplate[]>(this.load());
  readonly templates = this._templates.asReadonly();

  /**
   * Creates a template from a completed workout.
   * Returns the new template, or null if the name is blank/whitespace.
   */
  createFromWorkout(workout: Workout, name: string): WorkoutTemplate | null {
    const trimmedName = name.trim();
    if (!trimmedName) return null;

    const template: WorkoutTemplate = {
      id: `template-${Date.now()}-${++_idCounter}`,
      name: trimmedName,
      sourceWorkoutId: workout.id,
      exercises: workout.exercises.map(ex => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        sets: ex.sets.map(s => ({ reps: s.reps })),
      })),
      createdAt: new Date().toISOString(),
    };

    const updated = [...this._templates(), template];
    this._templates.set(updated);
    this.save(updated);
    return template;
  }

  /**
   * Renames a template. Returns false if the name is blank/whitespace.
   */
  rename(id: string, name: string): boolean {
    const trimmedName = name.trim();
    if (!trimmedName) return false;

    const updated = this._templates().map(t =>
      t.id === id ? { ...t, name: trimmedName } : t
    );
    this._templates.set(updated);
    this.save(updated);
    return true;
  }

  /**
   * Deletes a template by id. Source workout records remain unchanged.
   */
  delete(id: string): void {
    const updated = this._templates().filter(t => t.id !== id);
    this._templates.set(updated);
    this.save(updated);
  }

  getById(id: string): WorkoutTemplate | undefined {
    return this._templates().find(t => t.id === id);
  }

  private load(): WorkoutTemplate[] {
    return this.storage.get<WorkoutTemplate[]>(STORAGE_KEY) ?? [];
  }

  private save(templates: WorkoutTemplate[]): void {
    this.storage.set(STORAGE_KEY, templates);
  }
}
