import {AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {WebcamImage, WebcamModule} from "ngx-webcam";
import {createDetector, Keypoint, Pose, PoseDetector, SupportedModels} from '@tensorflow-models/pose-detection';
import {atan2, ready} from "@tensorflow/tfjs";
import {BehaviorSubject, throttleTime} from "rxjs";
import {takeWhile} from "rxjs/operators";
import {CocoKeypoints} from "../../../models/tensorflow/coco-keypoints";
import {Joint} from "../../../models/joint";
import {JointMeasurement} from "../../../models/tensorflow/joint-measurement";
import {JointEnum} from "../../../models/ref/joint-enum";
import {Assessment} from "../../../models/assessment";

@Component({
  selector: 'app-camera',
  standalone: true,
  imports: [CommonModule, WebcamModule],
  templateUrl: './camera.component.html',
  styleUrl: './camera.component.scss'
})
export class CameraComponent implements OnInit, AfterViewInit {
  @Output()
  // public keypointAngleTracked: EventEmitter<{ keypoint: CocoKeypoints, angle: number }> = new EventEmitter();
  public keypointAngleTracked: EventEmitter<JointMeasurement> = new EventEmitter();

  public loading = true;

  public pose: Pose;

  @ViewChild('canvas')
  public canvas: ElementRef<HTMLCanvasElement>;

  public height: number = 480;
  public width: number = 640;

  private captureImageTriggerBS: BehaviorSubject<void> = new BehaviorSubject<void>(undefined);

  private poseDetector: PoseDetector;

  private context: CanvasRenderingContext2D | null;

  // private KEYPOINTS_TO_TRACK_ANGLES_FOR = new Map<CocoKeypoints, CocoKeypoints[]>([
  //   [CocoKeypoints.LEFT_ELBOW, [CocoKeypoints.LEFT_WRIST, CocoKeypoints.LEFT_SHOULDER]],
  //   [CocoKeypoints.LEFT_SHOULDER, [CocoKeypoints.LEFT_ELBOW, CocoKeypoints.LEFT_HIP]],
  //   [CocoKeypoints.RIGHT_SHOULDER, [CocoKeypoints.RIGHT_ELBOW, CocoKeypoints.RIGHT_HIP]],
  //   [CocoKeypoints.RIGHT_ELBOW, [CocoKeypoints.RIGHT_WRIST, CocoKeypoints.RIGHT_SHOULDER]],
  //   [CocoKeypoints.LEFT_HIP, [CocoKeypoints.LEFT_SHOULDER, CocoKeypoints.LEFT_ANKLE]],
  //   [CocoKeypoints.RIGHT_HIP, [CocoKeypoints.RIGHT_SHOULDER, CocoKeypoints.RIGHT_ANKLE]],
  //   [CocoKeypoints.LEFT_KNEE, [CocoKeypoints.LEFT_ANKLE, CocoKeypoints.LEFT_HIP]],
  //   [CocoKeypoints.RIGHT_KNEE, [CocoKeypoints.RIGHT_ANKLE, CocoKeypoints.RIGHT_HIP]],
  // ]);

  private KEYPOINTS_TO_TRACK_ANGLES_FOR: {
    joint: JointEnum,
    keypoint: CocoKeypoints,
    leftKeypoint: CocoKeypoints,
    rightKeypoint: CocoKeypoints
  }[] = [
    {
      joint: JointEnum.LEFT_ELBOW,
      keypoint: CocoKeypoints.LEFT_ELBOW,
      leftKeypoint: CocoKeypoints.LEFT_WRIST,
      rightKeypoint: CocoKeypoints.LEFT_SHOULDER
    },
    {
      joint: JointEnum.LEFT_SHOULDER,
      keypoint: CocoKeypoints.LEFT_SHOULDER,
      leftKeypoint: CocoKeypoints.LEFT_ELBOW,
      rightKeypoint: CocoKeypoints.LEFT_HIP
    },
    {
      joint: JointEnum.RIGHT_SHOULDER,
      keypoint: CocoKeypoints.RIGHT_SHOULDER,
      leftKeypoint: CocoKeypoints.RIGHT_ELBOW,
      rightKeypoint: CocoKeypoints.RIGHT_HIP
    },
    {
      joint: JointEnum.RIGHT_ELBOW,
      keypoint: CocoKeypoints.RIGHT_ELBOW,
      leftKeypoint: CocoKeypoints.RIGHT_WRIST,
      rightKeypoint: CocoKeypoints.RIGHT_SHOULDER
    },
    {
      joint: JointEnum.HIP,
      keypoint: CocoKeypoints.LEFT_HIP,
      leftKeypoint: CocoKeypoints.LEFT_SHOULDER,
      rightKeypoint: CocoKeypoints.LEFT_ANKLE
    },
    // {joint:JointEnum.,keypoint: CocoKeypoints.RIGHT_HIP, leftKeypoint: CocoKeypoints.RIGHT_SHOULDER, rightKeypoint: CocoKeypoints.RIGHT_ANKLE},
    {
      joint: JointEnum.LEFT_KNEE,
      keypoint: CocoKeypoints.LEFT_KNEE,
      leftKeypoint: CocoKeypoints.LEFT_ANKLE,
      rightKeypoint: CocoKeypoints.LEFT_HIP
    },
    {
      joint: JointEnum.RIGHT_KNEE,
      keypoint: CocoKeypoints.RIGHT_KNEE,
      leftKeypoint: CocoKeypoints.RIGHT_ANKLE,
      rightKeypoint: CocoKeypoints.RIGHT_HIP
    },
  ];

  // private jointMeasurements: JointMeasurement[] = [
  //   {
  //     joint: JointEnum.LEFT_ELBOW,
  //     keypoint
  //   }
  // ]

  constructor() {
  }

  public async ngOnInit(): Promise<void> {
    await ready(); //

    createDetector(SupportedModels.MoveNet, {})
      .then(poseDetector => {
        this.loading = false;
        this.poseDetector = poseDetector;
        this.captureImageTriggerBS.next(undefined);
      });
  }

  public async ngAfterViewInit(): Promise<void> {
    this.context = this.canvas.nativeElement.getContext('2d');

    if (this.context) {
      this.context.font = '20px sans-serif';
    }
  }

  drawPose(image: WebcamImage) {
    if (!this.poseDetector) {
      return;
    }

    this.poseDetector.estimatePoses(image.imageData, {}).then(poses => {
      if (poses?.length > 0) {
        this.pose = poses[0];
      } else {
        return;
      }

      this.KEYPOINTS_TO_TRACK_ANGLES_FOR.forEach((value: ({joint: JointEnum, keypoint: CocoKeypoints, leftKeypoint: CocoKeypoints, rightKeypoint: CocoKeypoints})) => {
        // let angle = this.measureAngle(this.pose.keypoints[value[0]], this.pose.keypoints[key], this.pose.keypoints[value[1]]);

        this.keypointAngleTracked.emit({
          joint: value.joint,
          keypoint: this.pose.keypoints[value.keypoint],
          leftKeypoint: this.pose.keypoints[value.leftKeypoint],
          rightKeypoint: this.pose.keypoints[value.rightKeypoint],
        });
      });

      // this.context?.clearRect(0, 0, this.width, this.height);
      this.context?.clearRect(0, 0, this.width, this.height);

      if (this.pose.keypoints.length) {
        this.context?.beginPath()
        for (let keypoint of this.pose.keypoints) {
          if (!keypoint?.score) {
            continue;
          }
          if (keypoint.score > 0.3) {
            // this.context?.lineTo(keypoint.x, keypoint.y);
            this.context?.moveTo(keypoint.x, keypoint.y);

            this.context?.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
            this.context?.fillText(keypoint.name ? keypoint.name : 'none', keypoint.x - 15, keypoint.y + 15)

            // this.context?.stroke();
            this.context?.fill();
          }

        }
      }
    }).finally(() => {
      this.captureImageTriggerBS.next(undefined);
    });
  }

  getCaptureImageTrigger() {
    return this.captureImageTriggerBS.asObservable().pipe(
      takeWhile(() => !this.loading),
      throttleTime(300)
    );
  }
}
