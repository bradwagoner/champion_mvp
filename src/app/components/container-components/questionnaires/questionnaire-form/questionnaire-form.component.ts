import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ButtonModule} from "primeng/button";
import {FormsModule} from "@angular/forms";
import {RadioButtonModule} from "primeng/radiobutton";
import {Questionnaire} from "../../../../models/questionnaire";
import {QuestionnaireService} from "../../../../services/questionnaire.service";
import {ActivatedRoute, RouterLink} from "@angular/router";
import {SelectButtonModule} from "primeng/selectbutton";
import {EnumToStringPipe} from "../../../../pipes/util/enum-to-titlecase.pipe";
import {StaticDataService} from "../../../../services/static-data.service";
import {AssessmentsService} from "../../../../services/assessments.service";
import {JointEnum} from "../../../../models/ref/joint-enum";
import {BehaviorSubject, combineLatest, combineLatestWith, forkJoin, Observable, tap} from "rxjs";
import {Assessment} from "../../../../models/assessment";
import {filter, take} from "rxjs/operators";
import {FilterAssessmentsByJointPipe} from "../../../../pipes/assessment/filter-assessments-by-joint.pipe";
import {
  MostRecentAssessmentGroupedByMotionPipe
} from "../../../../pipes/assessment/most-recent-assessment-grouped-by-motion.pipe";
import {Messages} from "../../../../../messages";

@Component({
  selector: 'app-questionnaire-form',
  standalone: true,
  providers: [FilterAssessmentsByJointPipe, MostRecentAssessmentGroupedByMotionPipe],
  imports: [CommonModule, ButtonModule, FormsModule, SelectButtonModule, RadioButtonModule, RouterLink, EnumToStringPipe, FilterAssessmentsByJointPipe, MostRecentAssessmentGroupedByMotionPipe,],
  templateUrl: './questionnaire-form.component.html',
  styleUrl: './questionnaire-form.component.scss'
})
export class QuestionnaireFormComponent {

  questionnaire: Questionnaire = new Questionnaire();
  joint: Observable<JointEnum>;
  mostRecentAssessmentsByMotion: Observable<Assessment[]>;


  constructor(staticDataService: StaticDataService,
              public assessmentsService: AssessmentsService,
              public questionnaireService: QuestionnaireService,
              activatedRoute: ActivatedRoute,
              filterAssessmentsByJointPipe: FilterAssessmentsByJointPipe,
              mostRecentAssessmentGroupedByMotionPipe: MostRecentAssessmentGroupedByMotionPipe
  ) {
    this.joint = staticDataService.getNotNullSelectedJoint();

    let assessments = assessmentsService.getMyAssessmentsAsObservable();
    this.joint
      .subscribe((joint) => {
        assessments = filterAssessmentsByJointPipe.transform(assessments, joint);
        assessments = mostRecentAssessmentGroupedByMotionPipe.transform(assessments)

        this.mostRecentAssessmentsByMotion = assessments;
      });

    activatedRoute.fragment
      .subscribe((fragment) => {
        staticDataService.setSelectedJoint((fragment as JointEnum) || null);
      });
  }

  saveQuestionnaire() {
    if (!this.joint) {
      throw new Error('Invalid state - no joint');
    }

    this.joint.subscribe((joint) => console.log('subbed to joint!', joint));
    this.mostRecentAssessmentsByMotion.subscribe((mrs) => console.log('subbed to mrs!', mrs));

    console.log('fork joining');
    combineLatest([this.joint, this.mostRecentAssessmentsByMotion])
      .pipe(take(1))
      .subscribe(([joint, assessments]) => {
        console.log('Fork Joined!', joint, assessments);
        if (joint) {
          this.questionnaire.joint = joint;
          this.questionnaire.assessmentIds = assessments.map<string>(assessment => assessment.id);

          console.log('saving!', this.questionnaire);
          this.questionnaireService.saveQuestionnaire(this.questionnaire);
        }
      });
  }

  protected readonly Messages = Messages;
}
