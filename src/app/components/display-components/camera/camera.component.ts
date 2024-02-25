import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {WebcamImage, WebcamModule} from "ngx-webcam";
import {BehaviorSubject} from "rxjs";
import {CustomPoseNet, load} from "@teachablemachine/pose";
import {AssessmentsService} from "../../../services/assessments.service";
import {ConvertPoseToJointMeasurements} from "../../../pipes/assessment/convert-pose-to-joint-measurements";

@Component({
    selector: 'app-camera',
    standalone: true,
    imports: [CommonModule, WebcamModule, ConvertPoseToJointMeasurements],
    templateUrl: './camera.component.html',
    styleUrl: './camera.component.scss'
})
export class CameraComponent implements OnInit, AfterViewInit {
    public loading = true;

    // public pose: Pose;

    @ViewChild('canvas')
    public canvas: ElementRef<HTMLCanvasElement>;

    public height: number = 480;
    public width: number = 640;

    public videoOptions: MediaTrackConstraints = {
        // flipHorizontal: true,
        facingMode: {
            ideal: 'user',
        }
    }

    private captureImageTriggerBS: BehaviorSubject<void> = new BehaviorSubject<void>(undefined);

    // private poseDetector: PoseDetector;

    private context: CanvasRenderingContext2D | null;

    // private flrModel: LayersModel;
    // public tidyImage: Tensor<Rank>;
    //
    // public tensors: Tensor<Rank>[] = [];

    public tmModel: CustomPoseNet;

    public predictions: { className: string, probability: number }[];

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


    // private jointMeasurements: JointMeasurement[] = [
    //   {
    //     joint: JointEnum.LEFT_ELBOW,
    //     keypoint
    //   }
    // ]

    constructor(public assessmentService: AssessmentsService) {
    }

    public async ngOnInit(): Promise<void> {
        // await ready(); //
        const modelLocation: string = '../../../../assets/tensorflow-models/front-side-model/model.json';
        const metadataLocation: string = '../../../../assets/tensorflow-models/front-side-model/metadata.json';

        load(modelLocation, metadataLocation).then((loadedTmModel) => {
            this.loading = false;
            console.log('PROMISE!', arguments);

            this.tmModel = loadedTmModel;

            console.log('tmModel', this.tmModel);
            console.log('tmModel.model', this.tmModel?.model);
            console.log('tmModel.getClassLabels', this.tmModel?.getClassLabels());

            this.captureImageTriggerBS.next(undefined);
        }); //

        // this.tmModel = await load('../../../../assets/tensorflow-models/front-left-right-pose-model/model.json', '../../../../assets/tensorflow-models/front-left-right-pose-model/metadata.json');


        // --> last working this.flrModel = await loadLayersModel('../../../../assets/tensorflow-models/front-left-right-pose-model/model.json');
        // x this.flrModel = await window.tmImage('../../../../assets/tensorflow-models/front-left-right-pose-model/model.json');
        // x this.flrModel.estimate
        // x this.flrModel = sequential({
        //     layers: [
        //         layers.dense({
        //             units: 3, inputShape: [10]
        //         })
        //     ]
        // });


        // x conv2d({
        //     inputShope: [],
        //     kernelSize: 3,
        //     filters: 9,
        //     activation: 'relu'
        // });
        // this.flrModel.summary();
        // this.flrModel.inputLayers.forEach((layer) => console.log('LAYER:', layer));

        // this.captureImageTriggerBS.next(undefined);
        // createDetector(SupportedModels.MoveNet, {
        //     enableSmoothing: true,
        //     inputResolution: {
        //         width: this.width,
        //         height: this.height,
        //     },
        //     // enableSegmentation: true,
        //     // smoothSegmentation: true,
        // }).then(poseDetector => {
        //     // this.loading = false;
        //     this.poseDetector = poseDetector;
        //     // this.captureImageTriggerBS.next(undefined);
        // });
    }

    public async ngAfterViewInit(): Promise<void> {
        this.context = this.canvas.nativeElement.getContext('2d');

        if (this.context) {
            this.context.font = '20px sans-serif';
        }
    }

    processWebcamImage(image: WebcamImage) {
        if (this.loading) {
            return;
        }

        this.loading = true;

        try {
            this.determinePose(image);
        } catch (e) {
            console.warn('processWebcamImage Exception', e);
        }

        // this.drawPose(image);
    }

    determinePose(image: WebcamImage) {
        if (!this.tmModel) {
            return;
        }

        console.log('DeterminingPose');

        this.tmModel
            .estimatePose(image.imageData)
            .then(this.processEstimatedPoses.bind(this))
            .catch(reason => {
                console.warn("RMPredict Catching: ", reason);
                new Promise(f => setTimeout(f, 250)).then(() => {
                    this.loading = false;
                    this.captureImageTriggerBS.next(undefined);
                });
                // this.loading = false;
                // this.captureImageTriggerBS.next(undefined);
            });
    }

    processEstimatedPoses(poseEstimation: {
        pose: any,
        posenetOutput: Float32Array
    }): void | PromiseLike<void> {
        console.log('CALLING processTmModelPoseEstimations.', arguments);
        this.tmModel.predict(poseEstimation.posenetOutput).then(this.processPosePredictions.bind(this));
        console.log('PREDICTED processTmModelPoseEstimations.', arguments);
        this.assessmentService.trackPose(poseEstimation.pose);

        // this.KEYPOINTS_TO_TRACK_ANGLES_FOR.forEach((value: ({
        //     joint: JointEnum,
        //     keypoint: CocoKeypoints,
        //     leftKeypoint: CocoKeypoints,
        //     rightKeypoint: CocoKeypoints,
        // })) => {
        //
        //     this.keypointAngleTracked.emit({
        //         joint: value.joint,
        //         keypoint: poseEstimation.pose.keypoints[value.keypoint],
        //         leftKeypoint: poseEstimation.pose.keypoints[value.leftKeypoint],
        //         rightKeypoint: poseEstimation.pose.keypoints[value.rightKeypoint],
        //     });
        // });
    }

    processPosePredictions(predictions: {
        className: string,
        probability: number
    }[]) {
        console.log('CALLING processTmModelPredictions.', arguments);
        for (let i = 0; i < this.tmModel.getTotalClasses(); i++) {
            console.log('PREDICK:', predictions[i].className, predictions[i].probability);
        }

        this.predictions = predictions;

        new Promise(f => setTimeout(f, 250)).then(() => {
            this.loading = false;
            this.captureImageTriggerBS.next(undefined);
        });
    }

    getCaptureImageTrigger() {
        return this.captureImageTriggerBS.asObservable().pipe(
            // takeWhile(() => !this.loading),
            // filter(() => !this.loading),
            // debounceTime(500)
            // throttleTime(500)

        );
    }


    //
    // determineFlrModelPoses(image: WebcamImage) {
    //     this.flrModel.summary(1000, [], (message) => alert(message));
    //     const results = this.flrModel.execute(this.tidyImage, ['front-left-right-pose-model']);
    //     const resultArray = Array.isArray(results) ? results : [results];
    //     this.tensors = resultArray;
    //
    //     resultArray.forEach(result => {
    //         // const prediction = result.dataSync();
    //         result.data().then((prediction) => {
    //             if (prediction.length > 0) {
    //                 // this.renderPrediction(prediction);
    //             }
    //         });
    //     });
    // }
    //
    // drawPose(image: WebcamImage) {
    //     if (!this.poseDetector) {
    //         return;
    //     }
    //
    //     this.poseDetector.estimatePoses(image.imageData, {}).then(poses => {
    //         console.log('estimating poses!', poses);
    //         if (poses?.length > 0) {
    //             // this.pose = poses[0];
    //         } else {
    //             return;
    //         }
    //
    //         // this.KEYPOINTS_TO_TRACK_ANGLES_FOR.forEach((value: ({
    //         //     joint: JointEnum,
    //         //     keypoint: CocoKeypoints,
    //         //     leftKeypoint: CocoKeypoints,
    //         //     rightKeypoint: CocoKeypoints,
    //         // })) => {
    //             // let angle = this.measureAngle(this.pose.keypoints[value[0]], this.pose.keypoints[key], this.pose.keypoints[value[1]]);
    //
    //             // this.keypointAngleTracked.emit({
    //             //     joint: value.joint,
    //             //     keypoint: this.pose.keypoints[value.keypoint],
    //             //     leftKeypoint: this.pose.keypoints[value.leftKeypoint],
    //             //     rightKeypoint: this.pose.keypoints[value.rightKeypoint],
    //             // });
    //         // });
    //
    //         // this.context?.clearRect(0, 0, this.width, this.height);
    //         this.context?.clearRect(0, 0, this.width, this.height);
    //
    //         if (this.pose.keypoints.length) {
    //             this.context?.beginPath()
    //             for (let keypoint of this.pose.keypoints) {
    //                 if (!keypoint?.score) {
    //                     continue;
    //                 }
    //                 if (keypoint.score > 0.3) {
    //                     // this.context?.lineTo(keypoint.x, keypoint.y);
    //                     this.context?.moveTo(keypoint.x, keypoint.y);
    //
    //                     this.context?.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
    //                     this.context?.fillText(keypoint.name ? keypoint.name : 'none', keypoint.x - 15, keypoint.y + 15)
    //
    //                     // this.context?.stroke();
    //                     this.context?.fill();
    //                 }
    //
    //             }
    //         }
    //     }).finally(() => {
    //         console.log('OH GOD!!!!!');
    //         // this.captureImageTriggerBS.next(undefined);
    //     });
    // }
}
