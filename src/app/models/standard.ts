import {MotionEnum} from "./ref/motion-enum";
import {JointEnum} from "./ref/joint-enum";

export class Standard {

  joint: JointEnum | string;

  motion: MotionEnum | string;

  allAges: boolean;

  ageMin: string;
  ageMax: string;

  sex: string;

  mean: number | string;
  standardDeviation: number | string;
  median: number | string;

  rangeMin: number | string;
  rangeMax: number | string;

}
