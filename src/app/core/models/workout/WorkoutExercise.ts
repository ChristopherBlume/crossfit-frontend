export interface WorkoutExercise {
    id: string,
    workout_id: string,
    exercise_id: string
    reps: number | null;
    weight: number | null;
    duration: number | null;
    calories: number | null;
    distance: number | null;
}
