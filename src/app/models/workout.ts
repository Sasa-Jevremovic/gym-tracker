import { WorkoutSet } from './set';

export type WorkoutSplit = 'Upper' | 'Lower' | 'Push' | 'Pull' | 'Legs' | 'Full Body' | 'Rest Day';

export interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  date: string; // ISO date string
  notes: string;
  exercises: WorkoutExercise[];
  split?: WorkoutSplit;
}
