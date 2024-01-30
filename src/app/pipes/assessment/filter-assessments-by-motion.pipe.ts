import {Pipe, PipeTransform} from '@angular/core';
import {Assessment} from "../../models/assessment";
import {MotionEnum} from "../../models/ref/motion-enum";
import {map, Observable} from "rxjs";
import {JointEnum} from "../../models/ref/joint-enum";

@Pipe({
  name: 'filterAssessmentsByMotion',
  standalone: true
})
export class FilterAssessmentsByMotionPipe implements PipeTransform {


  transform(assessments: Observable<Assessment[]>, motion: MotionEnum): Observable<Assessment[]> {
    return assessments.pipe(
      map(assessmentArray => {
        return assessmentArray.filter(assessment => {
          return assessment.motion == motion;
        });
      })
    );
  }

}
