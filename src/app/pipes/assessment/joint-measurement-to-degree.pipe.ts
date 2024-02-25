import {Pipe, PipeTransform} from '@angular/core';
import {JointMeasurement} from "../../models/tensorflow/joint-measurement";
import {isObservable, map, Observable, of} from "rxjs";
import {Keypoint} from "@tensorflow-models/pose-detection";

@Pipe({
    name: 'jointMeasurementToDegree',
    standalone: true
})
export class JointMeasurementToDegreePipe implements PipeTransform {

    transform(jointMeasurement: Observable<JointMeasurement> | JointMeasurement): Observable<number> {
        if (isObservable(jointMeasurement)) {
            return jointMeasurement.pipe(
                map(jointMeasurement => {
                    return this.measureAngle(jointMeasurement.keypoint, jointMeasurement.leftKeypoint, jointMeasurement.rightKeypoint);
                })
            )
        }

        return of(this.measureAngle(jointMeasurement.keypoint, jointMeasurement.leftKeypoint, jointMeasurement.rightKeypoint));
    }

    measureAngle(a: Keypoint, b: Keypoint, c: Keypoint): number {
        const AB = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
        const BC = Math.sqrt(Math.pow(b.x - c.x, 2) + Math.pow(b.y - c.y, 2));
        const AC = Math.sqrt(Math.pow(c.x - a.x, 2) + Math.pow(c.y - a.y, 2));

        return Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB)) * 180;
    }

}
