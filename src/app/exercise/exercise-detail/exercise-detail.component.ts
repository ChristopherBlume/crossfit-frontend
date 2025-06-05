import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Exercise } from '../../core/models/exercises/Exercise';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { Fluid } from 'primeng/fluid';
import { UIChart } from 'primeng/chart';
import 'chartjs-adapter-date-fns';
import { TooltipItem } from 'chart.js';
import { NgIf } from '@angular/common';
import { DataService, RepMaxEntry } from '../../core/services/data.service';

type ExtendedProgressPoint = {
    date: string;
    metric: number | null;
    workout_id: string;
    workout_type: string;
    reps?: number | null;
    weight?: number | null;
};

type ChartDataPoint = {
    x: string;
    y: number | null;
    workout_type: string;
    workout_id: string;
};

@Component({
    selector: 'app-exercise-detail',
    imports: [Dialog, Button, Fluid, UIChart, NgIf],
    templateUrl: './exercise-detail.component.html',
    styleUrl: './exercise-detail.component.scss'
})
export class ExerciseDetailComponent implements OnChanges {
    @Input() visible = false;
    @Input() exercise:
        | undefined
        | (Exercise & {
              progress?: ExtendedProgressPoint[];
              bestPerformance?: { metric: number | null; date: string | null };
          });
    @Output() closeDialog = new EventEmitter<void>(); // Notify parent to close dialog

    lineOptions: any;
    chartData: any;
    dataService = inject(DataService);
    oneRepMax: RepMaxEntry | null | undefined;
    threeRepMax!: RepMaxEntry | null | undefined;
    fiveRepMax!: RepMaxEntry | null | undefined;


    constructor() {
        this.initChartOptions();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible'] && this.visible && this.exercise?.progress) {
            this.initChartOptions(); // Ensure options are initialized
            this.prepareChartData();
        }

        if (changes['exercise'] && this.exercise?.progress) {
            this.initChartOptions(); // Ensure options are initialized
            this.prepareChartData();
        }

        this.dataService.getTopRepMaxes(this.exercise?.name).subscribe((results) => {
            this.oneRepMax = results[1];
            this.threeRepMax = results[3];
            this.fiveRepMax = results[5];
        });
    }

    hideDialog() {
        this.closeDialog.emit(); // Notify parent to close dialog
    }

    initChartOptions(): void {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

        this.lineOptions = {
            maintainAspectRatio: false,
            aspectRatio: 0.6,
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context: TooltipItem<'line'>) => {
                            const raw = context.raw as any;
                            const type = raw?.workout_type ?? 'Unbekannt';
                            const value = raw?.y ?? 'n/a';
                            const id = raw?.workout_id ?? '';
                            return [`Typ: ${type}`, `Wert: ${value}`, `Workout: /workouts/${id}`];
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'category',
                    time: {
                        unit: 'day',
                        tooltipFormat: 'dd.MM.yy',
                        displayFormats: {
                            day: 'dd.MM.yy'
                        }
                    },
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false
                    }
                }
            }
        };
    }

    prepareChartData(): void {
        if (!this.exercise?.progress) return;

        this.initChartOptions();

        const sortedProgress = this.exercise.progress
            .map((item) => ({
                formattedDate: new Date(item.date).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                }),
                metric: item.metric,
                workout_type: item.workout_type,
                workout_id: item.workout_id
            }))
            .sort((a, b) => new Date(a.formattedDate).getTime() - new Date(b.formattedDate).getTime());

        const data: ChartDataPoint[] = sortedProgress.map((item) => ({
            x: item.formattedDate,
            y: item.metric,
            workout_type: item.workout_type,
            workout_id: item.workout_id
        }));

        this.chartData = {
            datasets: [
                {
                    label: 'Fortschritt',
                    data,
                    parsing: {
                        xAxisKey: 'x',
                        yAxisKey: 'y'
                    },
                    borderColor: '#42A5F5',
                    backgroundColor: '#42A5F5',
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }
            ]
        };

        this.calculateDynamicYAxisHeight(data);
    }

    private calculateDynamicYAxisHeight(data: ChartDataPoint[]): void {
        const validData = data.filter((value) => value.x != null);
        const metricValues = validData.map((v) => v.y!);
        const maxValue = metricValues.length > 0 ? Math.max(...metricValues) : 0;
        const buffer = 40;
        this.lineOptions.scales.y.suggestedMax = maxValue + buffer;
    }
}
