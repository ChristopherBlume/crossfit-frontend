import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'exerciseNames',
    standalone: true,
    pure: true // ensures it's only recalculated on input change
})
export class ExerciseNamesPipe implements PipeTransform {
    transform(exercises: { exercise_name?: string }[]): string {
        return exercises
            .map(e => e.exercise_name || '❓')
            .join(', ');
    }
}
