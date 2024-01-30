import {Pipe, PipeTransform} from '@angular/core';
import {JointMeasurement} from "../../models/tensorflow/joint-measurement";
import {map, Observable, scan} from "rxjs";
import {filter} from "rxjs/operators";

@Pipe({
  name: 'jointMeasurementConfidenceFilter',
  standalone: true
})
export class JointMeasurementConfidenceFilterPipe implements PipeTransform {

  transform(jointMeasurement: Observable<JointMeasurement>,
            currentAverageAngle?: number,
            scanBufferLength: number = 10,
            scoreThreshold: number = .6
  ): Observable<JointMeasurement> {
    return jointMeasurement.pipe(
      filter<JointMeasurement>(jointMeasurement => {
        return !!(
          jointMeasurement?.keypoint?.score && jointMeasurement.keypoint.score > scoreThreshold &&
          jointMeasurement?.leftKeypoint?.score && jointMeasurement.leftKeypoint.score > scoreThreshold &&
          jointMeasurement?.rightKeypoint?.score && jointMeasurement.rightKeypoint.score > scoreThreshold
        )
      }),
      // scan((acc: JointMeasurement[], value: JointMeasurement) => {
      //   if (
      //     value?.keypoint?.score && value.keypoint.score > scoreThreshold &&
      //     value?.leftKeypoint?.score && value.leftKeypoint.score > scoreThreshold &&
      //     value?.rightKeypoint?.score && value.rightKeypoint.score > scoreThreshold
      //   ) {
      //     acc.push(value);
      //   }
      //
      //   if (acc.length > scanBufferLength) {
      //     acc.shift()
      //   }
      //
      //   return acc;
      // }, []),
    );
  }

}
