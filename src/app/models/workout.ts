import { WorkoutSet } from './set';

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
}
