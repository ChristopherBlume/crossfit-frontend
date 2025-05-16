<p-dialog [(visible)]="visible"
          [style]="{ width: '600px', height: '1000px' }"
          header="Neues Workout"
          [modal]="true"
          (onHide)="hideDialog()">
    <ng-template #content>
        <form [formGroup]="workoutForm">
            <div class="flex flex-col gap-4">
                <!-- Date -->
                <div>
                    <div class="block font-bold mb-2">Datum</div>
                    <p-datepicker formControlName="date" [showIcon]="true" [showButtonBar]="true" fluid></p-datepicker>
                </div>

                <!-- Workout Type -->
                <div>
                    <div class="block font-bold mb-2">Workout Type</div>
                    <p-autocomplete
                        formControlName="workoutType"
                        fluid
                        [suggestions]="autoFilteredWorkoutType"
                        optionLabel="label"
                        placeholder="Search"
                        dropdown
                        (completeMethod)="filterWorkoutTypes($event)"
                    ></p-autocomplete>
                </div>

                <!-- Time and Rounds -->
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <div class="block font-bold mb-2">Zeit (Minuten)</div>
                        <input pInputText formControlName="totalTime" placeholder="MM:SS" />
                    </div>
                    <div class="col-span-6">
                        <div class="block font-bold mb-2">Runden</div>
                        <p-inputNumber formControlName="totalRounds" [min]="0" mode="decimal" [showButtons]="true"></p-inputNumber>
                    </div>
                </div>

                <!-- Notes -->
                <div>
                    <label for="notes" class="block font-bold mb-1">Notes</label>
                    <textarea id="notes" pTextarea formControlName="notes" required rows="3" cols="20" fluid></textarea>
                </div>

                <!-- Exercises -->
                <div>
                    <div class="flex justify-between items-center">
                        <label class="block font-bold mb-3">Übungen</label>
                        <p-button icon="pi pi-plus" [rounded]="true" [text]="true" severity="secondary" (click)="addExerciseGroup()"></p-button>
                    </div>

                    <div formArrayName="exercises">
                        <p-accordion id="exercises">
                            <p-accordion-panel
                                *ngFor="let exercise of exercisesArray.controls; let i = index"
                                [formGroupName]="i"
                                class="flex flex-col gap-2"
                                [value]="i"
                            >
                                <p-accordion-header>
                                    {{ exercise.get('exercise')?.value?.name || 'Übungsname' }}
                                </p-accordion-header>
                                <p-accordion-content>
                                    <!-- Exercise Autocomplete -->
                                    <div class="block font-bold mb-2">Übung</div>
                                    <p-autocomplete
                                        formControlName="exercise"
                                        [suggestions]="autoFilteredExercises"
                                        optionLabel="name"
                                        placeholder="Wähle Übung"
                                        dropdown
                                        (completeMethod)="filterExercises($event)"
                                        class="mb-3"
                                    ></p-autocomplete>

                                    <!-- Reps -->
                                    <div class="grid grid-cols-12 gap-4 mt-3">
                                        @if (exercise.get('exercise')?.value) {
                                            @if (exercise.get('exercise')?.value?.category === 'Strength' || exercise.get('exercise')?.value?.category === 'Bodyweight') {
                                                <div class="col-span-6">
                                                    <div class="block font-bold mb-2">Wiederholungen</div>
                                                    <p-inputNumber formControlName="reps" placeholder="Reps"></p-inputNumber>
                                                </div>
                                                <div class="col-span-6">
                                                    <div class="block font-bold mb-2">Gewicht</div>
                                                    <p-inputNumber formControlName="weight" placeholder="Weight"></p-inputNumber>
                                                </div>
                                            }
                                            @if (exercise.get('exercise')?.value?.category === 'Cardio') {
                                                <div class="col-span-6">
                                                    <div class="block font-bold mb-2">Zeit (Minuten)</div>
                                                    <p-inputNumber formControlName="duration" placeholder="Minuten"></p-inputNumber>
                                                </div>
                                                <div class="col-span-6">
                                                    <div class="block font-bold mb-2">Kalorien</div>
                                                    <p-inputNumber formControlName="calories" placeholder="Kalorien"></p-inputNumber>
                                                </div>
                                                <div class="col-span-6">
                                                    <div class="block font-bold mb-2">Distanz (Meter)</div>
                                                    <p-inputNumber formControlName="distance" placeholder="Distanz"></p-inputNumber>
                                                </div>
                                            }
                                            <div class="col-span-3 flex items-center">
                                                <p-button
                                                    icon="pi pi-trash"
                                                    [rounded]="true"
                                                    [text]="true"
                                                    severity="danger"
                                                    (click)="removeExerciseGroup(i)"
                                                ></p-button>
                                            </div>
                                        }
                                    </div>
                                </p-accordion-content>
                            </p-accordion-panel>
                        </p-accordion>
                    </div>
                </div>
            </div>
        </form>
    </ng-template>
    <ng-template #footer>
        <p-button label="Abbrechen" icon="pi pi-times" text (click)="hideDialog()" />
        <p-button label="Speichern" icon="pi pi-check" (click)="save()" />
    </ng-template>
</p-dialog>

