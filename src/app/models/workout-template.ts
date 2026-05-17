export interface TemplateExercise {
  exerciseId: string;
  exerciseName: string;
  /** Default reps per set (no weights stored). */
  sets: { reps: number }[];
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  sourceWorkoutId?: string;
  exercises: TemplateExercise[];
  createdAt: string;
}
