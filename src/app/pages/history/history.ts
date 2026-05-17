import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkoutService } from '../../services/workout';
import { WorkoutTemplateService } from '../../services/workout-template';

type ActiveTab = 'workouts' | 'templates';

@Component({
  selector: 'app-history',
  imports: [DatePipe, FormsModule],
  templateUrl: './history.html',
  styleUrl: './history.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class History {
  private readonly workoutService = inject(WorkoutService);
  private readonly templateService = inject(WorkoutTemplateService);

  readonly sortedWorkouts = this.workoutService.sortedWorkouts;
  readonly templates = this.templateService.templates;

  activeTab = signal<ActiveTab>('workouts');
  expandedWorkoutId = signal<string | null>(null);

  /** Save-as-template state per workout */
  savingTemplateForWorkoutId = signal<string | null>(null);
  newTemplateName = signal<string>('');
  templateNameError = signal<string>('');

  /** Rename-template state */
  renamingTemplateId = signal<string | null>(null);
  renameValue = signal<string>('');
  renameError = signal<string>('');

  toggle(id: string): void {
    this.expandedWorkoutId.update(current => (current === id ? null : id));
  }

  deleteWorkout(id: string, event: Event): void {
    event.stopPropagation();
    if (confirm('Delete this workout?')) {
      this.workoutService.deleteWorkout(id);
    }
  }

  startSaveAsTemplate(workoutId: string, event: Event): void {
    event.stopPropagation();
    this.savingTemplateForWorkoutId.set(workoutId);
    this.newTemplateName.set('');
    this.templateNameError.set('');
  }

  cancelSaveAsTemplate(): void {
    this.savingTemplateForWorkoutId.set(null);
    this.newTemplateName.set('');
    this.templateNameError.set('');
  }

  confirmSaveAsTemplate(workoutId: string): void {
    const name = this.newTemplateName();
    if (!name.trim()) {
      this.templateNameError.set('Template name cannot be blank.');
      return;
    }
    const workout = this.workoutService.workouts().find(w => w.id === workoutId);
    if (!workout) return;

    this.templateService.createFromWorkout(workout, name);
    this.savingTemplateForWorkoutId.set(null);
    this.newTemplateName.set('');
    this.templateNameError.set('');
  }

  deleteTemplate(id: string): void {
    if (confirm('Delete this template? Your workout history will not be affected.')) {
      this.templateService.delete(id);
    }
  }

  startRename(id: string, currentName: string): void {
    this.renamingTemplateId.set(id);
    this.renameValue.set(currentName);
    this.renameError.set('');
  }

  cancelRename(): void {
    this.renamingTemplateId.set(null);
    this.renameValue.set('');
    this.renameError.set('');
  }

  confirmRename(id: string): void {
    const name = this.renameValue();
    const success = this.templateService.rename(id, name);
    if (!success) {
      this.renameError.set('Template name cannot be blank.');
      return;
    }
    this.renamingTemplateId.set(null);
    this.renameValue.set('');
    this.renameError.set('');
  }
}
