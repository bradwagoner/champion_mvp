import {Pipe, PipeTransform} from '@angular/core';
import {Assessment} from "../../models/assessment";
import {map, Observable} from "rxjs";

@Pipe({
  name: 'filterAssessmentsById',
  standalone: true
})
export class FilterAssessmentsByIdPipe implements PipeTransform {
  transform(assessments: Observable<Assessment[]>, id: string): Observable<Assessment> {
    return assessments.pipe(
      map(assessmentArray => {
        let matchedAssessment = assessmentArray.find(assessment => {
          // return false;
          return assessment.id == id;
        });

        if (matchedAssessment) {
          return matchedAssessment;
        }

        throw new Error('Failed to filter Assessemnts by id pipe, no assessment matched');
      })
    );
  }

}
