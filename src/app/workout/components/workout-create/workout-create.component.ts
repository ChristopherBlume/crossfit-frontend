import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { Accordion, AccordionContent, AccordionHeader, AccordionPanel } from 'primeng/accordion';
import {
    AbstractControl,
    FormArray,
    FormBuilder, FormGroup,
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
import { JsonPipe, NgForOf, NgIf } from '@angular/common';
import { DataService } from '../../../core/services/data.service';
import { WorkoutService } from '../../service/workout.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Workout } from '../../../core/models/workout/Workout';
import { WorkoutExercise } from '../../../core/models/workout/WorkoutExercise';
import { TimeFormatterPipe } from '../../../core/pipes/time-formatter.pipe';
import { Toast } from 'primeng/toast';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-workout-create',
    imports: [ReactiveFormsModule, DatePicker, InputText, InputNumber, Button, AutoComplete, Textarea, NgForOf, NgIf, Toast],
    templateUrl: './workout-create.component.html',
    styleUrl: './workout-create.component.scss'
})
export class WorkoutCreateComponent implements OnInit {
    @Input() visible = false;
    @Output() closeDialog = new EventEmitter<void>(); // Notify parent to close dialog

    fb = inject(FormBuilder);
    dataService = inject(DataService);
    workoutService = inject(WorkoutService);
    messageService = inject(MessageService);

    router = inject(Router);
    route = inject(ActivatedRoute);

    timeFormatterPipe = inject(TimeFormatterPipe);

    workoutForm = this.fb.nonNullable.group({
        date: ['', Validators.required],
        workoutType: ['', Validators.required],
        totalTime: ['', this.timeFormatValidator()],
        totalRounds: [0, null],
        notes: [''],
        exercises: this.fb.array([])
    });

    autoFilteredWorkoutType: { label: string }[] = [];
    autoFilteredExercises: Exercise[] = [];
    workoutTypes = [{ label: 'AMRAP' }, { label: 'FOR_TIME' }, { label: 'X_ROUNDS_FOR_TIME' }, { label: 'X_ROUNDS_FOR_REPS' }, { label: 'STRENGTH' }, { label: 'EMOM' }, { label: 'PARTNER_WOD' }, { label: 'GYM' }];
    exercises: Exercise[] = [];
    workout: { workout: Workout; exercises: (WorkoutExercise & { exercise_name: string })[] } | null = null;

    // For edit mode
    isReadOnly: boolean = false;

    ngOnInit(): void {
        const workoutId = this.route.snapshot.paramMap.get('id');

        if (workoutId) {
            this.isReadOnly = true;
            this.workoutForm.disable();

            forkJoin({
                exercises: this.dataService.getExercises(),
                workout: this.dataService.getWorkoutWithExercises(workoutId)
            }).subscribe(({ exercises, workout }) => {
                this.exercises = exercises;
                this.workout = workout;
                console.log('exercises: ', exercises);
                this.populateFormForReadOnlyMode();
            });
        } else {
            this.isReadOnly = false;

            this.dataService.getExercises().subscribe((exercises) => {
                this.exercises = exercises;
            });
        }
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
        console.log('formatted workout: ', formattedWorkout);
        this.dataService.addWorkout(formattedWorkout.workout, formattedWorkout.exercises).subscribe({
            next: () => {
                this.workoutService.addWorkoutToState({
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

    enableEditMode(): void {
        this.isReadOnly = false;
        this.workoutForm.enable();
    }

    saveFromEdit(): void {
        console.log("Saving from Edit");
        const id = this.workout?.workout.id;
        const workoutFormValue = this.workoutForm.value;

        const formattedWorkout = this.mapWorkoutToBackendFormat({
            ...workoutFormValue,
            id // <-- inject the workout ID manually
        });

        console.log('formattedworkout: ', formattedWorkout);


        this.dataService.updateWorkout(formattedWorkout.workout, formattedWorkout.exercises).subscribe(() => {
            this.messageService.add({ severity: 'success', summary: 'Gespeichert', detail: 'Workout wurde gespeichert' });
            this.workoutService.updateWorkout(formattedWorkout.workout, formattedWorkout.exercises);
            this.isReadOnly = true;
            this.workoutForm.disable();
        });
    }

    onActionButtonClick() {
        if (this.isReadOnly) {
            this.enableEditMode();
        } else {
            if (this.workout) {
                this.saveFromEdit();
            } else {
                this.save();
            }
        }
    }

    private populateFormForReadOnlyMode(): void {
        if (this.workout) {
            const renderedDate = this.renderDateForDisplay(this.workout.workout.workout_date);
            const formattedTime = this.timeFormatterPipe.transform(this.workout.workout.total_time ?? 0, 'toTime');

            this.workoutForm.patchValue({
                date: renderedDate,
                workoutType: this.workout.workout.workout_type,
                totalTime: formattedTime,
                totalRounds: this.workout.workout.total_rounds,
                notes: this.workout.workout.notes ?? ''
            });

            const exercisesArray = this.workoutForm.get('exercises') as FormArray;
            exercisesArray.clear();

            this.workout.exercises.forEach((exercise: any) => {
                const matchedExercise = this.exercises.find((e) => e.name === exercise.exercise_name);
                const exerciseGroup = this.fb.group({
                    id: [exercise.id], // <-- Make sure to preserve the exercise ID
                    exercise: [{ value: matchedExercise || null, disabled: this.isReadOnly }],
                    reps: [{ value: exercise.reps, disabled: this.isReadOnly }],
                    weight: [{ value: exercise.weight, disabled: this.isReadOnly }],
                    duration: [{ value: exercise.duration, disabled: this.isReadOnly }],
                    calories: [{ value: exercise.calories, disabled: this.isReadOnly }],
                    distance: [{ value: exercise.distance, disabled: this.isReadOnly }]
                });
                exercisesArray.push(exerciseGroup);
            });
        }
    }

    private mapWorkoutToBackendFormat(formData: any): any {
        const convertTimeToSeconds = (time: string): number | null => {
            if (!time) return null;
            const [minutes, seconds] = time.split(':').map(Number);
            return minutes * 60 + seconds;
        };

        return {
            workout: {
                id: formData.id, // also include workout ID for PATCH
                workout_date: formData.date, // Format the date correctly
                workout_type: formData.workoutType.label, // Get the label from the workout type object
                total_time: convertTimeToSeconds(formData.totalTime),
                total_rounds: formData.totalRounds || null,
                notes: formData.notes || ''
            },
            exercises: formData.exercises.map((exercise: any) => ({
                id: exercise.id,
                exercise_id: exercise.exercise.id, // Ensure ID is passed
                reps: exercise.reps || null,
                weight: exercise.weight || null,
                duration: exercise.duration || null,
                calories: exercise.calories || null,
                distance: exercise.distance || null
            }))
        };
    }

    private timeFormatValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = control.value;
            const timeRegex = /^[0-5]?[0-9]:[0-5][0-9]$/; // Matches MM:SS
            return value && !timeRegex.test(value) ? { invalidTimeFormat: true } : null;
        };
    }

    private renderDateForDisplay(date: string): string {
        const dateObject = new Date(date); // Backend format is assumed to be YYYY-MM-DD
        return `${dateObject.getDate().toString().padStart(2, '0')}.${(dateObject.getMonth() + 1).toString().padStart(2, '0')}.${dateObject.getFullYear()}`;
    }
}
