import { Component, inject, signal, computed, effect, ElementRef, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WorkoutService } from '../../services/workout';
import { ExerciseService } from '../../services/exercise';
import { DatePipe } from '@angular/common';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

@Component({
  selector: 'app-progress',
  imports: [FormsModule, DatePipe],
  templateUrl: './progress.html',
  styleUrl: './progress.scss',
})
export class Progress {
  private readonly workoutService = inject(WorkoutService);
  private readonly exerciseService = inject(ExerciseService);

  readonly exercises = this.exerciseService.exercises;
  readonly personalRecords = this.workoutService.personalRecords;

  selectedExerciseId = signal('');
  private chart: Chart | null = null;
  readonly chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');

  readonly chartData = this.workoutService.progressForExercise(this.selectedExerciseId);

  constructor() {
    effect(() => {
      const data = this.chartData();
      const canvas = this.chartCanvas();
      if (!canvas || !data || data.length === 0) {
        this.chart?.destroy();
        this.chart = null;
        return;
      }
      const exerciseName = this.exercises().find(e => e.id === this.selectedExerciseId())?.name ?? '';
      if (this.chart) {
        this.chart.destroy();
      }
      this.chart = new Chart(canvas.nativeElement, {
        type: 'line',
        data: {
          labels: data.map(d => d.date),
          datasets: [{
            label: `${exerciseName} (kg)`,
            data: data.map(d => d.maxWeightKg),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,0.15)',
            tension: 0.3,
            pointBackgroundColor: '#6366f1',
            fill: true,
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { labels: { color: '#d1d5db' } },
          },
          scales: {
            x: { ticks: { color: '#9ca3af' }, grid: { color: '#374151' } },
            y: { ticks: { color: '#9ca3af' }, grid: { color: '#374151' }, beginAtZero: false },
          },
        },
      });
    });
  }
}
