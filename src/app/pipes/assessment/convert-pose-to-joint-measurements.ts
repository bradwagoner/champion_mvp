import {Pipe, PipeTransform} from '@angular/core';
import {map, Observable} from "rxjs";
import {JointEnum} from "../../models/ref/joint-enum";
import {CocoKeypoints} from "../../models/tensorflow/coco-keypoints";
import {JointMeasurement} from "../../models/tensorflow/joint-measurement";
import {Pose} from "@tensorflow-models/pose-detection";

@Pipe({
    name: 'convertPoseToJointMeasurements',
    standalone: true
})
export class ConvertPoseToJointMeasurements implements PipeTransform {

    transform(pose: Observable<Pose>, joint?: JointEnum): Observable<JointMeasurement[]> {
        return pose.pipe(
            map((pose) => {
                let jointMeasurements: (JointMeasurement | null)[] = [];
                if (joint) {
                    jointMeasurements.push(this.getJointMeasurementForJoint(pose, joint));
                } else {
                    this.JOINT_TO_KEYPOINT_MAP.forEach((keypoints, jointIterator) => {
                        jointMeasurements.push(this.getJointMeasurementForJoint(pose, jointIterator));
                    });
                }

                // console.log('JOINtS!', jointMeasurements);
                return jointMeasurements.filter((measurement) => !!measurement) as JointMeasurement[];
            })
        )
    }

    private getJointMeasurementForJoint(pose: Pose, joint: JointEnum) {
        let keypoints = this.JOINT_TO_KEYPOINT_MAP.get(joint);

        if (!pose || !pose.keypoints || !keypoints || !keypoints?.keypoint || !keypoints?.leftKeypoint || !keypoints?.rightKeypoint) {
            console.error('Failed to load related keypoints');
            return null;
        }

        return <JointMeasurement>({
            joint: joint,
            keypoint: pose.keypoints[keypoints.keypoint],
            leftKeypoint: pose.keypoints[keypoints.leftKeypoint],
            rightKeypoint: pose.keypoints[keypoints.rightKeypoint],
        });
    }

    public JOINT_TO_KEYPOINT_MAP: Map<JointEnum, {
        keypoint: CocoKeypoints,
        leftKeypoint: CocoKeypoints,
        rightKeypoint: CocoKeypoints
    }> = new Map([
        [JointEnum.LEFT_ELBOW, {
            keypoint: CocoKeypoints.LEFT_ELBOW,
            leftKeypoint: CocoKeypoints.LEFT_WRIST,
            rightKeypoint: CocoKeypoints.LEFT_SHOULDER
        }],
        [JointEnum.LEFT_SHOULDER, {
            keypoint: CocoKeypoints.LEFT_SHOULDER,
            leftKeypoint: CocoKeypoints.LEFT_ELBOW,
            rightKeypoint: CocoKeypoints.LEFT_HIP
        }],
        [JointEnum.RIGHT_SHOULDER, {
            keypoint: CocoKeypoints.RIGHT_SHOULDER,
            leftKeypoint: CocoKeypoints.RIGHT_ELBOW,
            rightKeypoint: CocoKeypoints.RIGHT_HIP
        }],
        [JointEnum.RIGHT_ELBOW, {
            keypoint: CocoKeypoints.RIGHT_ELBOW,
            leftKeypoint: CocoKeypoints.RIGHT_WRIST,
            rightKeypoint: CocoKeypoints.RIGHT_SHOULDER
        }],
        [JointEnum.HIP, {
            keypoint: CocoKeypoints.LEFT_HIP,
            leftKeypoint: CocoKeypoints.LEFT_SHOULDER,
            rightKeypoint: CocoKeypoints.LEFT_ANKLE
        }],
        [JointEnum.LEFT_KNEE, {
            keypoint: CocoKeypoints.LEFT_KNEE,
            leftKeypoint: CocoKeypoints.LEFT_ANKLE,
            rightKeypoint: CocoKeypoints.LEFT_HIP
        }],
        [JointEnum.RIGHT_KNEE, {
            keypoint: CocoKeypoints.RIGHT_KNEE,
            leftKeypoint: CocoKeypoints.RIGHT_ANKLE,
            rightKeypoint: CocoKeypoints.RIGHT_HIP
        }],
    ]);
}
