import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { vi } from 'vitest';
import { WorkoutService } from '../../services/workout';
import { WorkoutTemplateService } from '../../services/workout-template';
import { History } from './history';

describe('History - Template Management (WT-1 & WT-3)', () => {
  let component: History;
  let fixture: ComponentFixture<History>;
  let workoutService: WorkoutService;
  let templateService: WorkoutTemplateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [History, FormsModule, DatePipe],
      providers: [WorkoutService, WorkoutTemplateService],
    }).compileComponents();

    localStorage.clear();
    fixture = TestBed.createComponent(History);
    component = fixture.componentInstance;
    workoutService = TestBed.inject(WorkoutService);
    templateService = TestBed.inject(WorkoutTemplateService);
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  const addWorkout = () =>
    workoutService.addWorkout({
      date: '2025-01-01',
      notes: 'Great session',
      exercises: [
        {
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          sets: [{ reps: 10, weightKg: 80 }],
        },
      ],
    });

  describe('WT-1: Save completed workout as template', () => {
    it('opens save-as-template form for the correct workout', () => {
      const workout = addWorkout();
      const event = new MouseEvent('click', { bubbles: true });
      component.startSaveAsTemplate(workout.id, event);

      expect(component.savingTemplateForWorkoutId()).toBe(workout.id);
    });

    it('creates a template with the entered name', () => {
      const workout = addWorkout();
      const event = new MouseEvent('click', { bubbles: true });
      component.startSaveAsTemplate(workout.id, event);
      component.newTemplateName.set('Upper A');
      component.confirmSaveAsTemplate(workout.id);

      expect(templateService.templates()).toHaveLength(1);
      expect(templateService.templates()[0].name).toBe('Upper A');
    });

    it('shows an error and does not save for a blank name', () => {
      const workout = addWorkout();
      const event = new MouseEvent('click', { bubbles: true });
      component.startSaveAsTemplate(workout.id, event);
      component.newTemplateName.set('');
      component.confirmSaveAsTemplate(workout.id);

      expect(templateService.templates()).toHaveLength(0);
      expect(component.templateNameError()).toBeTruthy();
    });

    it('shows an error for whitespace-only names', () => {
      const workout = addWorkout();
      const event = new MouseEvent('click', { bubbles: true });
      component.startSaveAsTemplate(workout.id, event);
      component.newTemplateName.set('   ');
      component.confirmSaveAsTemplate(workout.id);

      expect(templateService.templates()).toHaveLength(0);
      expect(component.templateNameError()).toBeTruthy();
    });

    it('dismisses the form after successful save', () => {
      const workout = addWorkout();
      const event = new MouseEvent('click', { bubbles: true });
      component.startSaveAsTemplate(workout.id, event);
      component.newTemplateName.set('Upper A');
      component.confirmSaveAsTemplate(workout.id);

      expect(component.savingTemplateForWorkoutId()).toBeNull();
    });

    it('does not modify the source workout after saving as template', () => {
      const workout = addWorkout();
      const originalExercises = JSON.parse(JSON.stringify(workout.exercises));
      const event = new MouseEvent('click', { bubbles: true });
      component.startSaveAsTemplate(workout.id, event);
      component.newTemplateName.set('Upper A');
      component.confirmSaveAsTemplate(workout.id);

      const storedWorkout = workoutService.workouts().find(w => w.id === workout.id)!;
      expect(storedWorkout.exercises).toEqual(originalExercises);
    });

    it('cancels save-as-template and clears form state', () => {
      const workout = addWorkout();
      const event = new MouseEvent('click', { bubbles: true });
      component.startSaveAsTemplate(workout.id, event);
      component.newTemplateName.set('My Template');
      component.cancelSaveAsTemplate();

      expect(component.savingTemplateForWorkoutId()).toBeNull();
      expect(component.newTemplateName()).toBe('');
    });

    it('newly saved template is available immediately without reload', () => {
      const workout = addWorkout();
      const event = new MouseEvent('click', { bubbles: true });
      component.startSaveAsTemplate(workout.id, event);
      component.newTemplateName.set('Instant Template');
      component.confirmSaveAsTemplate(workout.id);

      expect(component.templates()).toHaveLength(1);
      expect(component.templates()[0].name).toBe('Instant Template');
    });
  });

  describe('WT-3: Manage template library', () => {
    const createTemplate = (name: string) => {
      const workout = addWorkout();
      const event = new MouseEvent('click', { bubbles: true });
      component.startSaveAsTemplate(workout.id, event);
      component.newTemplateName.set(name);
      component.confirmSaveAsTemplate(workout.id);
    };

    it('shows empty state when no templates exist', () => {
      expect(component.templates()).toHaveLength(0);
    });

    it('lists all saved templates', () => {
      createTemplate('Upper A');
      createTemplate('Lower B');
      expect(component.templates()).toHaveLength(2);
    });

    it('starts rename mode with current name pre-filled', () => {
      createTemplate('Original Name');
      const id = templateService.templates()[0].id;

      component.startRename(id, 'Original Name');

      expect(component.renamingTemplateId()).toBe(id);
      expect(component.renameValue()).toBe('Original Name');
    });

    it('renames a template and persists the change', () => {
      createTemplate('Old Name');
      const id = templateService.templates()[0].id;

      component.startRename(id, 'Old Name');
      component.renameValue.set('New Name');
      component.confirmRename(id);

      expect(templateService.templates()[0].name).toBe('New Name');
      expect(component.renamingTemplateId()).toBeNull();
    });

    it('rejects blank rename and shows error', () => {
      createTemplate('My Template');
      const id = templateService.templates()[0].id;

      component.startRename(id, 'My Template');
      component.renameValue.set('');
      component.confirmRename(id);

      expect(component.renameError()).toBeTruthy();
      expect(templateService.templates()[0].name).toBe('My Template');
    });

    it('cancels rename without saving', () => {
      createTemplate('Keep Me');
      const id = templateService.templates()[0].id;

      component.startRename(id, 'Keep Me');
      component.renameValue.set('Changed');
      component.cancelRename();

      expect(templateService.templates()[0].name).toBe('Keep Me');
      expect(component.renamingTemplateId()).toBeNull();
    });

    it('deletes a template while keeping workout history', () => {
      createTemplate('Delete Me');
      const id = templateService.templates()[0].id;

      // Override confirm to return true
      vi.spyOn(window, 'confirm').mockReturnValueOnce(true);
      component.deleteTemplate(id);

      expect(templateService.templates()).toHaveLength(0);
      expect(workoutService.workouts()).toHaveLength(1);
    });

    it('does not delete template when user cancels confirmation', () => {
      createTemplate('Keep Me');
      const id = templateService.templates()[0].id;

      vi.spyOn(window, 'confirm').mockReturnValueOnce(false);
      component.deleteTemplate(id);

      expect(templateService.templates()).toHaveLength(1);
    });

    it('targeting delete uses stable id not name (duplicate names)', () => {
      createTemplate('Upper A');
      createTemplate('Upper A');
      const idToDelete = templateService.templates()[0].id;

      vi.spyOn(window, 'confirm').mockReturnValueOnce(true);
      component.deleteTemplate(idToDelete);

      expect(templateService.templates()).toHaveLength(1);
      expect(templateService.templates()[0].id).not.toBe(idToDelete);
    });
  });
});
