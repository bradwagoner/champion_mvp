import {Pipe, PipeTransform} from '@angular/core';
import {map, Observable, scan} from "rxjs";

@Pipe({
  name: 'runningAverage',
  standalone: true
})
export class RunningAveragePipe implements PipeTransform {
  transform(obs: Observable<number>, scanBufferLength: number = 10): Observable<number> {
    if (obs) {
      return obs.pipe(
        scan((acc: number[], value) => {
          acc.push(value);

          if (acc.length > scanBufferLength) {
            acc.shift();
          }

          return acc;
        }, []),
        map(value => {
          return value.reduce((prev, curr) => {
            return (prev + curr);
          }, 0) / value.length;
        })
      )
    }
    return obs;
  }
}
