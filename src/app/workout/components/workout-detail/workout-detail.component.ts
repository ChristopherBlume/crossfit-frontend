import { Component, inject, OnInit, } from '@angular/core';
import { Accordion, AccordionContent, AccordionHeader, AccordionPanel } from 'primeng/accordion';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputNumber } from 'primeng/inputnumber';
import { AutoComplete } from 'primeng/autocomplete';
import { DatePicker } from 'primeng/datepicker';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Button } from 'primeng/button';
import { NgForOf } from '@angular/common';
import { WorkoutService } from '../../service/workout.service';
import { DataService } from '../../../core/services/data.service';
import { TimeFormatterPipe } from '../../../core/pipes/time-formatter.pipe';
import { Workout } from '../../../core/models/workout/Workout';
import { WorkoutExercise } from '../../../core/models/workout/WorkoutExercise';
import { MessageService } from 'primeng/api';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-workout-detail',
    imports: [Accordion, ReactiveFormsModule, InputNumber, AutoComplete, DatePicker, InputText, Textarea, AccordionPanel, AccordionHeader, AccordionContent, Button, NgForOf],
    templateUrl: './workout-detail.component.html',
    styleUrl: './workout-detail.component.scss'
})
export class WorkoutDetailComponent implements OnInit {
    route = inject(ActivatedRoute);
    fb = inject(FormBuilder);
    workoutService = inject(WorkoutService);
    dataService = inject(DataService);
    messageService = inject(MessageService);
    timeFormatterPipe = inject(TimeFormatterPipe);

    workout: { workout: Workout; exercises: WorkoutExercise[] } | null = null;


    workoutForm = this.fb.nonNullable.group({
        date: [{ value: '', disabled: true }], // Value is empty, and the control is disabled
        workoutType: [{ value: '', disabled: true }],
        totalTime: [{ value: '', disabled: true }],
        totalRounds: [{ value: null as number | null, disabled: true }],
        notes: [{ value: '', disabled: true }],
        exercises: this.fb.array([]) // Form array for exercises, will manage disabling later
    });

    ngOnInit(): void {
        const workoutId = this.route.snapshot.paramMap.get('id');
        if (!workoutId) return;

        this.dataService.getWorkoutWithExercises(workoutId).subscribe((data) => {
            if (data) {
                this.workout = data;
                this.populateForm();
            }
        });
    }

    isEditMode = false;

    edit() {
        this.isEditMode = true;
        this.workoutForm.enable();
    }

    save() {
        if (this.workoutForm.invalid) return;

        const { workout, exercises } = this.mapFormToWorkout();

        this.dataService.updateWorkout(workout, exercises).subscribe(() => {
            this.messageService.add({ severity: 'success', summary: 'Gespeichert', detail: 'Workout wurde gespeichert' });
            this.workoutService.updateWorkout(workout, exercises);
            this.isEditMode = false;
            this.workoutForm.disable();
        });
    }

    private mapFormToWorkout(): { workout: Workout; exercises: WorkoutExercise[] } {
        const formValue = this.workoutForm.getRawValue();

        const convertTimeToSeconds = (time: string | null): number | null => {
            if (!time || !time.includes(':')) return null; // Handle invalid or null time values
            const [minutes, seconds] = time.split(':').map(Number);
            return minutes * 60 + seconds;
        };

        const convertDateToBackendFormat = (date: string): string => {
            if (!date) return ''; // Ensure it always returns a string
            const [day, month, year] = date.split('.').map(Number); // Parse DD.MM.YYYY
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`; // Format to YYYY-MM-DD
        };

        const workout: Workout = {
            id: this.workout!.workout.id,
            workout_date: convertDateToBackendFormat(formValue.date), // Convert to backend format
            workout_type: formValue.workoutType,
            total_time: convertTimeToSeconds(formValue.totalTime), // Convert time to seconds
            total_rounds: formValue.totalRounds !== null ? +formValue.totalRounds : null,
            notes: formValue.notes || '',
            user_id: this.workout!.workout.user_id,
        }

        const exercises: WorkoutExercise[] = formValue.exercises.map((exercise: any, index: number) => ({
            id: this.workout!.exercises[index]?.id || null,
            workout_id: this.workout!.workout.id,
            exercise_id: exercise.exercise_id,
            exercise_name: exercise.exercise_name,
            reps: exercise.reps !== null ? +exercise.reps : null,
            weight: exercise.weight !== null ? +exercise.weight : null,
            duration: exercise.duration !== null ? +exercise.duration : null,
            calories: exercise.calories !== null ? +exercise.calories : null,
            distance: exercise.distance !== null ? +exercise.distance : null
        }));

        return { workout, exercises };

    }

    get exercisesArray(): FormArray {
        return this.workoutForm.get('exercises') as FormArray;
    }

    private populateForm(): void {
        if (this.workout) {
            const renderedDate = this.renderDateForDisplay(this.workout.workout.workout_date);
            const formattedTime = this.timeFormatterPipe.transform(this.workout.workout.total_time ?? 0, 'toTime');
            console.log("formattedTime: ", formattedTime);
            // Set top-level form controls
            this.workoutForm.patchValue({
                date: renderedDate,
                workoutType: this.workout.workout.workout_type,
                totalTime: formattedTime,
                totalRounds: this.workout.workout.total_rounds,
                notes: this.workout.workout.notes ?? ''
            });

            // Clear the exercises form array before repopulating
            const exercisesArray = this.workoutForm.get('exercises') as FormArray;
            exercisesArray.clear(); // Clear any existing controls

            // Populate exercises
            this.workout.exercises.forEach((exercise: any) => {
                const exists = exercisesArray.controls.some((control) => control.value.exercise_name === exercise.exercise_name);
                if (!exists) {
                    const exerciseGroup = this.fb.nonNullable.group({
                        exercise_name: [{ value: exercise.exercise_name, disabled: true }],
                        reps: [{ value: exercise.reps, disabled: true }],
                        weight: [{ value: exercise.weight, disabled: true }],
                        duration: [{ value: exercise.duration, disabled: true }],
                        calories: [{ value: exercise.calories, disabled: true }],
                        distance: [{ value: exercise.distance, disabled: true }]
                    });
                    console.log('Exercise group being added:', exercise);
                    exercisesArray.push(exerciseGroup);
                }
            });
        }
    }

// Utility to render the date in DD.MM.YYYY format for user display
    private renderDateForDisplay(date: string): string {
        const dateObject = new Date(date); // Backend format is assumed to be YYYY-MM-DD
        return `${dateObject.getDate().toString().padStart(2, '0')}.${(dateObject.getMonth() + 1)
            .toString()
            .padStart(2, '0')}.${dateObject.getFullYear()}`;
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
}
