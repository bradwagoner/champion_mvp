import {Pipe, PipeTransform} from '@angular/core';
import {map, Observable} from "rxjs";
import {Assessment} from "../../models/assessment";
import {MotionEnum} from "../../models/ref/motion-enum";

@Pipe({
  name: 'mostRecentAssessmentGroupedByMotion',
  standalone: true
})
export class MostRecentAssessmentGroupedByMotionPipe implements PipeTransform {

  transform(assessments: Observable<Assessment[]>): Observable<Assessment[]> {
    return assessments.pipe(
      map(assessmentArray => {
        let mostRecentAssessmentByMotion = new Map<MotionEnum, Assessment>();
        assessmentArray.forEach(assessment => {
          if (!mostRecentAssessmentByMotion.has(assessment.motion) || (mostRecentAssessmentByMotion.get(assessment.motion)?.dateCreated || 0) < assessment.dateCreated) {
            mostRecentAssessmentByMotion.set(assessment.motion, assessment);
          }
        });

        return Array.from(mostRecentAssessmentByMotion.values());
      })
    );
  }
}
