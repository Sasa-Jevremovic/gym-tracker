import { computed, signal } from '@angular/core';
import { WorkoutExercise } from '../models/workout';
import { WorkoutSet } from '../models/set';
import { Exercise } from '../models/exercise';

/**
 * Owns the mutable state of a workout being composed by the user.
 * Instantiate once per LogWorkout page; not a shared service.
 */
export class WorkoutDraft {
  readonly exercises = signal<WorkoutExercise[]>([]);

  readonly canSave = computed(() =>
    this.exercises().some(w => w.sets.some(s => s.reps > 0))
  );

  readonly validExercises = computed(() =>
    this.exercises().filter(w => w.sets.some(s => s.reps > 0))
  );

  addExercise(exercise: Exercise): void {
    if (this.exercises().some(w => w.exerciseId === exercise.id)) return;
    this.exercises.update(list => [
      ...list,
      { exerciseId: exercise.id, exerciseName: exercise.name, sets: [{ reps: 0, weightKg: 0 }] },
    ]);
  }

  removeExercise(exerciseId: string): void {
    this.exercises.update(list => list.filter(w => w.exerciseId !== exerciseId));
  }

  addSet(exerciseId: string): void {
    this.exercises.update(list =>
      list.map(w =>
        w.exerciseId === exerciseId ? { ...w, sets: [...w.sets, { reps: 0, weightKg: 0 }] } : w
      )
    );
  }

  removeSet(exerciseId: string, setIndex: number): void {
    this.exercises.update(list =>
      list.map(w =>
        w.exerciseId === exerciseId
          ? { ...w, sets: w.sets.filter((_, i) => i !== setIndex) }
          : w
      )
    );
  }

  updateSet(exerciseId: string, setIndex: number, field: keyof WorkoutSet, value: number): void {
    this.exercises.update(list =>
      list.map(w =>
        w.exerciseId === exerciseId
          ? { ...w, sets: w.sets.map((s, i) => (i === setIndex ? { ...s, [field]: value } : s)) }
          : w
      )
    );
  }
}
