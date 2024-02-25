import {JointEnum} from "../ref/joint-enum";
import {Keypoint} from "@tensorflow-models/pose-detection";

export class JointMeasurement {
    joint: JointEnum;

    keypoint: Keypoint;
    leftKeypoint: Keypoint;
    rightKeypoint: Keypoint;
}
