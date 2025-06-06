import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { UIChart } from 'primeng/chart';
import { NgIf } from '@angular/common';
import { DataService, RepMaxEntry } from '../../core/services/data.service';
import { ChartDataPoint } from '../../core/models/exercises/ChartDataPoint';
import { Fluid } from 'primeng/fluid';

@Component({
    selector: 'app-exercise-detail',
    standalone: true,
    imports: [Dialog, Button, UIChart, NgIf, Fluid],
    templateUrl: './exercise-detail.component.html',
    styleUrl: './exercise-detail.component.scss'
})
export class ExerciseDetailComponent implements OnChanges {
    @Input() visible = false;
    @Input() exerciseName?: string;
    @Output() closeDialog = new EventEmitter<void>();

    chartData: any;
    lineOptions: any;
    oneRepMax: RepMaxEntry | null | undefined;
    threeRepMax: RepMaxEntry | null | undefined;
    fiveRepMax: RepMaxEntry | null | undefined;

    dataService = inject(DataService);

    constructor() {
        this.initChartOptions();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if ((changes['visible'] || changes['exerciseName']) && this.visible && this.exerciseName) {
            this.initChartOptions();
            this.dataService.getProgressForExerciseChartData(this.exerciseName).subscribe((progressData) => {
                this.prepareChartData(progressData);
            });

            this.dataService.getTopRepMaxes(this.exerciseName).subscribe((results) => {
                this.oneRepMax = results[1];
                this.threeRepMax = results[3];
                this.fiveRepMax = results[5];
            });
        }
    }

    hideDialog() {
        this.closeDialog.emit();
    }

    private initChartOptions(): void {
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
                        label: (ctx: any) => {
                            const point = ctx.raw;
                            return `Gewicht: ${point.y} kg • Reps: ${point.reps ?? '–'}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'category',
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

    private prepareChartData(data: ChartDataPoint[]): void {
        const sortedData = data.sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime());

        this.chartData = {
            datasets: [
                {
                    label: 'Fortschritt',
                    data: sortedData,
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

        this.calculateDynamicYAxisHeight(sortedData);
    }

    private calculateDynamicYAxisHeight(data: ChartDataPoint[]): void {
        const validData = data.filter((value) => value.y != null);
        const metricValues = validData.map((v) => v.y!);
        const maxValue = metricValues.length > 0 ? Math.max(...metricValues) : 0;
        const buffer = 40;
        this.lineOptions.scales.y.suggestedMax = maxValue + buffer;
    }
}
