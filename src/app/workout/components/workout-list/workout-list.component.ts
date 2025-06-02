import { Component, inject, OnInit } from '@angular/core';
import { Toolbar } from 'primeng/toolbar';
import { Button, ButtonDirective } from 'primeng/button';
import {
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { WorkoutService } from '../../service/workout.service';
import { TableModule } from 'primeng/table';
import { Ripple } from 'primeng/ripple';
import { DataService } from '../../../core/services/data.service';
import { DatePipe } from '@angular/common';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { Router } from '@angular/router';
import { ExerciseNamesPipe } from '../../../core/pipes/exercise-names.pipe';


@Component({
    selector: 'app-workout-list',
    imports: [InputTextModule, Toolbar, Button, ReactiveFormsModule, FormsModule, TableModule, ButtonDirective, Ripple, DatePipe, Toast, ExerciseNamesPipe],
    templateUrl: './workout-list.component.html',
    styleUrl: './workout-list.component.scss',
})
export class WorkoutListComponent implements OnInit {
    workoutService = inject(WorkoutService);
    dataService = inject(DataService);
    messageService = inject(MessageService);
    router = inject(Router);

    ngOnInit() {
        // Fetch workouts with their exercises
        this.dataService.getWorkouts().subscribe(
            (workouts) => {
                this.workoutService.workouts.set(workouts);
            },
            (error) => {
                console.error('Error fetching workouts:', error);
            }
        );
    }

    deleteWorkout(workoutId: string): void {
        if (confirm('Willst du das Workout wirklich löschen?')) {
            this.dataService.removeWorkout(workoutId).subscribe(
                () => {
                    console.log(`Workout with ID ${workoutId} successfully deleted.`);
                    this.workoutService.removeWorkout(workoutId);
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Workout gelöscht.' });
                },
                (error) => {
                    console.error(`Error deleting workout with ID ${workoutId}:`, error);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Etwas ist schiefgelaufen.' });
                }
            );
        }
    }

    openNewWorkoutForm(): void {
        this.router.navigateByUrl('/workouts/new');

    }

    openWorkoutDetailsDialog(workout: any) {
        console.log('Workout clicked in list: ', workout);
        this.router.navigateByUrl(`/workouts/${workout.workout.id}`);
    }
}
