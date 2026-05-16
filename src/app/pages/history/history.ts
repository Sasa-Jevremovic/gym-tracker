import { Component, inject, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { WorkoutService } from '../../services/workout';

@Component({
  selector: 'app-history',
  imports: [DatePipe],
  templateUrl: './history.html',
  styleUrl: './history.scss',
})
export class History {
  private readonly workoutService = inject(WorkoutService);

  readonly sortedWorkouts = computed(() =>
    [...this.workoutService.workouts()].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  );

  expandedWorkoutId = signal<string | null>(null);

  toggle(id: string): void {
    this.expandedWorkoutId.update(current => (current === id ? null : id));
  }

  deleteWorkout(id: string, event: Event): void {
    event.stopPropagation();
    if (confirm('Delete this workout?')) {
      this.workoutService.deleteWorkout(id);
    }
  }
}
