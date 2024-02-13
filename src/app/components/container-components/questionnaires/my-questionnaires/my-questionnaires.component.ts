import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {QuestionnaireService} from "../../../../services/questionnaire.service";
import {Questionnaire} from "../../../../models/questionnaire";
import {Observable} from "rxjs";
import {ButtonModule} from "primeng/button";
import {RouterModule} from "@angular/router";
import {QuestionnaireComponent} from "../../../display-components/questionnaire/questionnaire.component";
import {AssessmentsService} from "../../../../services/assessments.service";
import {Assessment} from "../../../../models/assessment";
import {FilterAssessmentsByIdsPipe} from "../../../../pipes/assessment/filter-assessments-by-ids.pipe";

@Component({
  selector: 'app-my-questionnaires',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterModule, QuestionnaireComponent, FilterAssessmentsByIdsPipe],
  templateUrl: './my-questionnaires.component.html',
  styleUrl: './my-questionnaires.component.scss'
})
export class MyQuestionnairesComponent {

  questionnaires: Observable<Questionnaire[]>;

  assessments: Observable<Assessment[]>;

  constructor(questionnairesService: QuestionnaireService, assessmentService: AssessmentsService) {
    this.questionnaires = questionnairesService.getMyQuestionnaires();
    // questionnairesService.refreshMyQuestionnaires();

    this.assessments = assessmentService.getMyAssessmentsAsObservable();
  }

}
