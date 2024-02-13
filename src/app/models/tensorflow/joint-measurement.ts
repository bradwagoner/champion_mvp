import {Keypoint} from "@tensorflow-models/posenet";
import {JointEnum} from "../ref/joint-enum";

export class JointMeasurement {
    joint: JointEnum;

    keypoint: Keypoint;
    leftKeypoint: Keypoint;
    rightKeypoint: Keypoint;
}
