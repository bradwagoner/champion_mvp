import {Pipe, PipeTransform} from '@angular/core';
import {map, Observable} from "rxjs";
import {Assessment} from "../../models/assessment";
import {JointEnum} from "../../models/ref/joint-enum";

@Pipe({
  name: 'mostRecentAssessmentGroupedByJoint',
  standalone: true
})
export class MostRecentAssessmentGroupedByJointPipe implements PipeTransform {

  transform(assessments: Observable<Assessment[]>): Observable<Assessment[]> {
    return assessments.pipe(
      map(assessmentArray => {
        let mostRecentJointAssessment = new Map<JointEnum, Assessment>();
        assessmentArray.forEach(assessment => {
          if (!mostRecentJointAssessment.has(assessment.joint) || (mostRecentJointAssessment.get(assessment.joint)?.dateCreated || 0) < assessment.dateCreated) {
            mostRecentJointAssessment.set(assessment.joint, assessment);
          }
        });

        return Array.from(mostRecentJointAssessment.values());
      })
    );
  }
}
