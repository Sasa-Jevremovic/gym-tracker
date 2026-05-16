import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WorkoutSet } from '../../models/set';
import { WorkoutExercise, WorkoutSplit } from '../../models/workout';
import { ExerciseService } from '../../services/exercise';
import { WorkoutService } from '../../services/workout';

@Component({
  selector: 'app-log-workout',
  imports: [FormsModule],
  templateUrl: './log-workout.html',
  styleUrl: './log-workout.scss',
})
export class LogWorkout {
  private readonly workoutService = inject(WorkoutService);
  private readonly exerciseService = inject(ExerciseService);
  private readonly router = inject(Router);

  readonly exercises = this.exerciseService.exercises;
  readonly categories = computed(() =>
    [...new Set(this.exercises().map((e) => e.category))].sort(),
  );
  readonly splits: WorkoutSplit[] = [
    'Upper',
    'Lower',
    'Push',
    'Pull',
    'Legs',
    'Full Body',
    'Rest Day',
  ];

  date = new Date().toISOString().split('T')[0];
  notes = '';
  split: WorkoutSplit | '' = '';
  workoutExercises = signal<WorkoutExercise[]>([]);

  selectedExerciseId = '';
  newExerciseName = '';
  newExerciseCategory = '';
  showAddExercise = false;

  addExerciseToWorkout(): void {
    if (!this.selectedExerciseId) return;
    const ex = this.exercises().find((e) => e.id === this.selectedExerciseId);
    if (!ex) return;
    const already = this.workoutExercises().some((w) => w.exerciseId === ex.id);
    if (already) return;
    this.workoutExercises.update((list) => [
      ...list,
      { exerciseId: ex.id, exerciseName: ex.name, sets: [{ reps: 0, weightKg: 0 }] },
    ]);
    this.selectedExerciseId = '';
  }

  addSet(exerciseId: string): void {
    this.workoutExercises.update((list) =>
      list.map((w) =>
        w.exerciseId === exerciseId ? { ...w, sets: [...w.sets, { reps: 0, weightKg: 0 }] } : w,
      ),
    );
  }

  removeSet(exerciseId: string, setIndex: number): void {
    this.workoutExercises.update((list) =>
      list.map((w) =>
        w.exerciseId === exerciseId ? { ...w, sets: w.sets.filter((_, i) => i !== setIndex) } : w,
      ),
    );
  }

  updateSet(exerciseId: string, setIndex: number, field: keyof WorkoutSet, value: number): void {
    this.workoutExercises.update((list) =>
      list.map((w) =>
        w.exerciseId === exerciseId
          ? {
              ...w,
              sets: w.sets.map((s, i) => (i === setIndex ? { ...s, [field]: value } : s)),
            }
          : w,
      ),
    );
  }

  removeExercise(exerciseId: string): void {
    this.workoutExercises.update((list) => list.filter((w) => w.exerciseId !== exerciseId));
  }

  addCustomExercise(): void {
    if (!this.newExerciseName.trim() || !this.newExerciseCategory.trim()) return;
    this.exerciseService.addExercise(this.newExerciseName, this.newExerciseCategory);
    this.newExerciseName = '';
    this.newExerciseCategory = '';
    this.showAddExercise = false;
  }

  saveWorkout(): void {
    const exercises = this.workoutExercises().filter((w) => w.sets.some((s) => s.reps > 0));
    if (exercises.length === 0) return;
    this.workoutService.addWorkout({
      date: this.date,
      notes: this.notes,
      exercises,
      split: this.split || undefined,
    });
    this.router.navigate(['/dashboard']);
  }

  get canSave(): boolean {
    return this.workoutExercises().some((w) => w.sets.some((s) => s.reps > 0));
  }
}
