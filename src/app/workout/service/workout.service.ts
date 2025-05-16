import { inject, Injectable, signal } from '@angular/core';
import { Workout } from '../../core/models/workout/Workout';
import { WorkoutExercise } from '../../core/models/workout/WorkoutExercise';
import { DataService } from '../../core/services/data.service';

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {
    workouts = signal<{ workout: Workout; exercises: WorkoutExercise[] }[]>([]);
    selectedWorkout = signal<{ workout: Workout; exercises: WorkoutExercise[] } | null>(null);

    dataService = inject(DataService);

    // Add a new workout to the state
    addWorkoutToState(newWorkout: { workout: Workout; exercises: WorkoutExercise[] }): void {
        this.workouts.update((workouts) => [...workouts, newWorkout]);
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

    // Set the selected workout
    selectWorkout(workoutId: string): void {
        const selected = this.workouts().find((w) => w.workout.id === workoutId) || null;
        this.selectedWorkout.set(selected);
    }

    // Clear the selected workout
    clearSelectedWorkout(): void {
        this.selectedWorkout.set(null);
    }
}
