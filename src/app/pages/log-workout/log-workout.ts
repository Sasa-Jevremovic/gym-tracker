import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WorkoutSplit } from '../../models/workout';
import { ExerciseService } from '../../services/exercise';
import { WorkoutService } from '../../services/workout';
import { WorkoutDraft } from '../../services/workout-draft';

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

  readonly draft = new WorkoutDraft();

  readonly exercises = this.exerciseService.exercises;
  readonly categories = computed(() =>
    [...new Set(this.exercises().map((e) => e.category))].sort(),
  );
  readonly splits: WorkoutSplit[] = [
    'Upper', 'Lower', 'Push', 'Pull', 'Legs', 'Full Body', 'Rest Day',
  ];

  date = new Date().toISOString().split('T')[0];
  notes = '';
  split: WorkoutSplit | '' = '';

  selectedExerciseId = '';
  newExerciseName = '';
  newExerciseCategory = '';
  showAddExercise = false;

  addExerciseToWorkout(): void {
    if (!this.selectedExerciseId) return;
    const ex = this.exercises().find((e) => e.id === this.selectedExerciseId);
    if (!ex) return;
    this.draft.addExercise(ex);
    this.selectedExerciseId = '';
  }

  addCustomExercise(): void {
    if (!this.newExerciseName.trim() || !this.newExerciseCategory.trim()) return;
    this.exerciseService.addExercise(this.newExerciseName, this.newExerciseCategory);
    this.newExerciseName = '';
    this.newExerciseCategory = '';
    this.showAddExercise = false;
  }

  saveWorkout(): void {
    if (!this.draft.canSave()) return;
    this.workoutService.addWorkout({
      date: this.date,
      notes: this.notes,
      exercises: this.draft.validExercises(),
      split: this.split || undefined,
    });
    this.router.navigate(['/dashboard']);
  }
}
