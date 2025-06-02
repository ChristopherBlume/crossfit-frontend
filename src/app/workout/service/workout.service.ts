import { Injectable, signal } from '@angular/core';
import { Workout } from '../../core/models/workout/Workout';
import { WorkoutExercise } from '../../core/models/workout/WorkoutExercise';

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {
    workouts = signal<{ workout: Workout; exercises: WorkoutExercise[] }[]>([]);

    // Add a new workout to the state
    addWorkoutToState(newWorkout: { workout: Workout; exercises: WorkoutExercise[] }): void {
        this.workouts.update((workouts) => [...workouts, newWorkout]);
    }

    getWorkoutFromState(id: string):  { workout: Workout; exercises: WorkoutExercise[] } | undefined {
        return this.workouts().find((w) => w.workout.id === id);
    }

    // Update a workout in the state
    updateWorkout(workout: Workout, exercises: WorkoutExercise[]): void {
        this.workouts.update((workouts) =>
            workouts.map((w) =>
                w.workout.id === workout.id
                    ? { workout, exercises } // Replace with updated workout and exercises
                    : w
            )
        );
    }

    // Remove a workout from the state
    removeWorkout(workoutId: string): void {
        this.workouts.update((workouts) => workouts.filter((w) => w.workout.id !== workoutId));
    }
}
