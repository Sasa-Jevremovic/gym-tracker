import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { WorkoutService } from '../../services/workout';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly workoutService = inject(WorkoutService);

  readonly recentWorkouts = this.workoutService.recentWorkouts;
  readonly totalWorkouts = computed(() => this.workoutService.workouts().length);
  readonly personalRecords = computed(() =>
    [...this.workoutService.personalRecords()]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  );
}
