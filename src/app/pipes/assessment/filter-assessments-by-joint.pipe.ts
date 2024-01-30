import {Pipe, PipeTransform} from '@angular/core';
import {Assessment} from "../../models/assessment";
import {JointEnum} from "../../models/ref/joint-enum";
import {forkJoin, map, Observable} from "rxjs";

@Pipe({
  name: 'filterAssessmentsByJoint',
  standalone: true
})
export class FilterAssessmentsByJointPipe implements PipeTransform {

  transform(assessments: Observable<Assessment[]>, joint: JointEnum): Observable<Assessment[]> {

    return assessments.pipe(
      map(assessmentArray => {
        return assessmentArray.filter(assessment => {
          return assessment.joint == joint;
        });
      })
    );
    // let jointObservable: Observable<JointEnum>;
    // if (joint instanceof Observable) {
    //   jointObservable = joint as Observable<JointEnum>;
    // } else if (joint) {
    //   jointObservable = new Observable<JointEnum>(joint);
    // }
    //
    // return forkJoin([assessments, jointObservable]).pipe(
    //   map(([assessmentArray, joint]) => {
    //       return assessmentArray.filter(assessment => {
    //         return assessment.joint == joint;
    //       });
    //     }
    //   )
    // );
  }
}
