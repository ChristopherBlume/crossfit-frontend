import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { Accordion, AccordionContent, AccordionHeader, AccordionPanel } from 'primeng/accordion';
import {
    AbstractControl,
    FormArray,
    FormBuilder,
    ReactiveFormsModule,
    ValidationErrors,
    ValidatorFn,
    Validators
} from '@angular/forms';
import { Exercise } from '../../../core/models/exercises/Exercise';
import { Dialog } from 'primeng/dialog';
import { DatePicker } from 'primeng/datepicker';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { Button } from 'primeng/button';
import { AutoComplete } from 'primeng/autocomplete';
import { Textarea } from 'primeng/textarea';
import { NgForOf } from '@angular/common';
import { DataService } from '../../../core/services/data.service';
import { WorkoutService } from '../../service/workout.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-workout-create',
    imports: [Accordion, Dialog, ReactiveFormsModule, DatePicker, InputText, InputNumber, Button, AccordionPanel, AccordionHeader, AccordionContent, AutoComplete, Textarea, NgForOf],
    templateUrl: './workout-create.component.html',
    styleUrl: './workout-create.component.scss'
})
export class WorkoutCreateComponent implements OnInit{
    @Input() visible = false;
    @Output() closeDialog = new EventEmitter<void>(); // Notify parent to close dialog

    fb = inject(FormBuilder);
    dataService = inject(DataService);
    router = inject(Router);
    workoutService = inject(WorkoutService);
    messageService = inject(MessageService);

    workoutForm = this.fb.nonNullable.group({
        date: ['', Validators.required],
        workoutType: ['', Validators.required],
        totalTime: ['', this.timeFormatValidator()],
        totalRounds: [null],
        notes: [''],
        exercises: this.fb.array([])
    });

    autoFilteredWorkoutType: { label: string }[] = [];
    autoFilteredExercises: Exercise[] = [];
    workoutTypes = [
        { label: 'AMRAP' },
        { label: 'FOR_TIME' },
        { label: 'X_ROUNDS_FOR_TIME' },
        { label: 'X_ROUNDS_FOR_REPS' },
        { label: 'STRENGTH' },
        { label: 'EMOM' },
        { label: 'PARTNER_WOD' },
        { label: 'GYM' },
    ];
    exercises: Exercise[] = [];

    ngOnInit(): void {
        // Fetch all exercises for the dropdown
       this.dataService.getExercises().subscribe((exercises) => {
            this.exercises = exercises;
        });
    }

    get exercisesArray(): FormArray {
        return this.workoutForm.get('exercises') as FormArray;
    }

    addExerciseGroup(): void {
        const exerciseGroup = this.fb.group({
            exercise: [null, Validators.required],
            reps: [null],
            weight: [null],
            duration: [null],
            calories: [null],
            distance: [null]
        });
        this.exercisesArray.push(exerciseGroup);
    }

    removeExerciseGroup(index: number): void {
        this.exercisesArray.removeAt(index);
    }

    filterWorkoutTypes(event: any): void {
        const query = event.query.toLowerCase();
        this.autoFilteredWorkoutType = this.workoutTypes.filter((type) => type.label.toLowerCase().includes(query));
    }

    filterExercises(event: any): void {
        const query = event.query.toLowerCase();
        this.autoFilteredExercises = this.exercises.filter((exercise) => exercise.name.toLowerCase().includes(query));
        console.log(this.autoFilteredExercises);
    }

    save(): void {
        const formattedWorkout = this.mapWorkoutToBackendFormat(this.workoutForm.value);
        console.log('formatted workout: ', formattedWorkout)
        this.dataService.addWorkout(
            formattedWorkout.workout,
            formattedWorkout.exercises
        )
            .subscribe({
                next: () => {
                    this.workoutService.addWorkout({
                        workout: formattedWorkout.workout,
                        exercises: formattedWorkout.exercises
                    });
                    this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: 'Workout gespeichert' });
                    this.router.navigateByUrl('/workouts');
                },
                error: (err) => {
                    console.error('Fehler beim Speichern des Workouts', err);
                    this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Workout konnte nicht gespeichert werden' });
                }
            });
    }

    private mapWorkoutToBackendFormat(formData: any): any {
        const convertTimeToSeconds = (time: string): number | null => {
            if (!time) return null;
            const [minutes, seconds] = time.split(':').map(Number);
            return minutes * 60 + seconds;
        };

        const formatDate = (date: Date): string => {
            if (!date) return '';
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        return {
            workout: {
                workout_date: formatDate(formData.date), // Format the date correctly
                workout_type: formData.workoutType.label, // Get the label from the workout type object
                total_time: convertTimeToSeconds(formData.totalTime),
                total_rounds: formData.totalRounds || null,
                notes: formData.notes || '',
            },
            exercises: formData.exercises.map((exercise: any) => ({
                exercise_id: exercise.exercise.id, // Ensure ID is passed
                reps: exercise.reps || null,
                weight: exercise.weight || null,
                duration: exercise.duration || null,
                calories: exercise.calories || null,
                distance: exercise.distance || null
            })),
        };
    }

    private timeFormatValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = control.value;
            const timeRegex = /^[0-5]?[0-9]:[0-5][0-9]$/; // Matches MM:SS
            return value && !timeRegex.test(value) ? { invalidTimeFormat: true } : null;
        };
    }
}
