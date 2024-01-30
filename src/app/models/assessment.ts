import {MotionEnum} from "./ref/motion-enum";
import {JointEnum} from "./ref/joint-enum";

export class Assessment {
  id: string;
  joint: JointEnum;
  motion: MotionEnum;

  rangeOfMotion: number | null;

  dateCreated: Date;
}
