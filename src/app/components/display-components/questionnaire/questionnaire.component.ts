import {Component, Input} from '@angular/core';
import { CommonModule } from '@angular/common';
import {Questionnaire} from "../../../models/questionnaire";
import {PanelModule} from "primeng/panel";
import {EnumToStringPipe} from "../../../pipes/util/enum-to-titlecase.pipe";
import {Assessment} from "../../../models/assessment";
import {Observable} from "rxjs";
import {AssessmentComponent} from "../assessment/assessment.component";
import {FilterAssessmentsByIdPipe} from "../../../pipes/assessment/filter-assessments-by-id.pipe";
import {JointEnum} from "../../../models/ref/joint-enum";
import {Messages} from "../../../../messages";
import {DividerModule} from "primeng/divider";

@Component({
  selector: 'app-questionnaire',
  standalone: true,
  imports: [CommonModule, PanelModule, EnumToStringPipe, AssessmentComponent, FilterAssessmentsByIdPipe, DividerModule],
  templateUrl: './questionnaire.component.html',
  styleUrl: './questionnaire.component.scss'
})
export class QuestionnaireComponent {

  @Input()
  questionnaire: Questionnaire;

  @Input()
  assessments: Observable<Assessment[]>;

  constructor() {
  }

  protected readonly JointEnum = JointEnum;
  protected readonly Messages = Messages;
}
