import {Pipe, PipeTransform} from '@angular/core';
import {Assessment} from "../../models/assessment";
import {map, Observable} from "rxjs";

@Pipe({
  name: 'filterAssessmentsByIds',
  standalone: true
})
export class FilterAssessmentsByIdsPipe implements PipeTransform {
  transform(assessments: Observable<Assessment[]>, ids: string[]): Observable<Assessment[]> {
    return assessments.pipe(
      map(assessmentArray => {
        return assessmentArray.filter(assessment => {
          // return false;
          return ids.indexOf(assessment.id) != -1;
        });
      })
    );
  }

  // transform(assessments: Assessment[], ids: string[]): Assessment[] {
  //   return assessments.filter(assessment => {
  //     // return false;
  //     return ids.indexOf(assessment.id) != -1;
  //   });
  // }

}
