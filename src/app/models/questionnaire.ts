import {MotionEnum} from "./ref/motion-enum";
import {JointEnum} from "./ref/joint-enum";

export class Questionnaire {
  joint: JointEnum;
  motion: MotionEnum;

  assessmentIds: string[];

  experiencedPain: boolean;
  experiencedWeakness: boolean;
  avoidedOrUnable: boolean;
  recentImprovement: boolean;
  disruptsSleep: boolean;

  dateCreated: Date;
}
