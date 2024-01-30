import {RefModel} from "./interfaces/ref-model";
import {JointEnum} from "./ref/joint-enum";

export class Joint implements RefModel {
  code: JointEnum;
  name: string;
}
