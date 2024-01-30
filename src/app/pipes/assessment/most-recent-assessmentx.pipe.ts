import {Pipe, PipeTransform} from '@angular/core';
import {map, Observable} from "rxjs";
import {Assessment} from "../../models/assessment";

@Pipe({
  name: 'mostRecentAssessment',
  standalone: true
})
export class MostRecentAssessment implements PipeTransform {

  transform(assessments: Observable<Assessment[]>): Observable<Assessment | null> {
    return assessments.pipe(
      map(assessmentArray => {
        let mostRecentAssessment: Assessment | null = null;
        assessmentArray.forEach(assessment => {
          if (!mostRecentAssessment || mostRecentAssessment.dateCreated < assessment.dateCreated) {
            mostRecentAssessment = assessment;
          }
        });

        return mostRecentAssessment;
      })
    );
  }
}
