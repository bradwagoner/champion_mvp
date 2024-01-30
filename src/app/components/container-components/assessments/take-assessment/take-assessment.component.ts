import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CameraComponent} from "../../../display-components/camera/camera.component";
import {CocoKeypoints} from "../../../../models/tensorflow/coco-keypoints";
import {Assessment} from "../../../../models/assessment";
import {AssessmentsService} from "../../../../services/assessments.service";
import {BehaviorSubject, Observable} from "rxjs";
import {RunningAveragePipe} from "../../../../pipes/running-average.pipe";
import {JointMeasurement} from "../../../../models/tensorflow/joint-measurement";
import {JointEnum} from "../../../../models/ref/joint-enum";
import {EnumToStringPipe} from "../../../../pipes/util/enum-to-titlecase.pipe";
import {JointMeasurementToDegreePipe} from "../../../../pipes/assessment/joint-measurement-to-degree.pipe";
import {Router} from "@angular/router";

@Component({
  selector: 'app-take-assessment',
  standalone: true,
  imports: [CommonModule, CameraComponent, RunningAveragePipe, EnumToStringPipe, JointMeasurementToDegreePipe],
  templateUrl: './take-assessment.component.html',
  styleUrl: './take-assessment.component.scss'
})
export class TakeAssessmentComponent {

  inProgressAssessment: Assessment;

  currentAngles: Map<JointEnum, BehaviorSubject<JointMeasurement>> = new Map();

  assessmentJointMeasurement: Observable<JointMeasurement>;

  constructor(public assessmentService: AssessmentsService, router: Router) {
    this.inProgressAssessment = assessmentService.getInProgressAssessment();
    if (!this.inProgressAssessment) {
      console.warn('failed to load in progress assessment');
      router.navigate(['/screenings']);
    }
  }

  processAngleMeasurement(jointMeasurement: JointMeasurement) {
    this.assessmentService.getInProgressAssessment();

    if (!this.currentAngles.has(jointMeasurement.joint)) {
      let newBs = new BehaviorSubject<JointMeasurement>(jointMeasurement);
      this.currentAngles.set(jointMeasurement.joint, newBs);

      if (jointMeasurement.joint == this.inProgressAssessment.joint) {
        this.assessmentJointMeasurement = newBs.asObservable();
      }
    } else {
      this.currentAngles.get(jointMeasurement.joint)?.next(jointMeasurement);
    }
  }

  protected readonly CocoKeypoints = CocoKeypoints;
  protected readonly JointEnum = JointEnum;
}
