import {Component, Input} from '@angular/core';
import { CommonModule } from '@angular/common';
import {Assessment} from "../../../models/assessment";
import {Observable} from "rxjs";
import {EnumToStringPipe} from "../../../pipes/util/enum-to-titlecase.pipe";

@Component({
  selector: 'app-assessment',
  standalone: true,
  imports: [CommonModule, EnumToStringPipe],
  templateUrl: './assessment.component.html',
  styleUrl: './assessment.component.scss'
})
export class AssessmentComponent {

  @Input()
  assessment: Observable<Assessment>;

  constructor() {
  }

}
