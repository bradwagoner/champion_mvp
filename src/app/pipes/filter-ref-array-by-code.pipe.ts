import {Pipe, PipeTransform} from '@angular/core';
import {RefModel} from "../models/interfaces/ref-model";

@Pipe({
  name: 'findRefArrayByCode',
  standalone: true
})
export class FindRefArrayByCodePipe implements PipeTransform {

  transform(refArray: RefModel[] | null, refCode: string): RefModel | null {
    if (!refArray) {
      throw new Error(`FindRefArrayByCodePipe failed due to null refArray.`);
    }

    let refModel: RefModel | undefined = refArray.find(refModel => refModel.code == refCode);

    if (!refModel) {
      console.warn(`FindRefArrayByCodePipe failed to lookup ${refCode} in ${refArray}.`);
      throw new Error(`FindRefArrayByCodePipe failed to lookup ${refCode} in ${refArray}.`);
    }
    return refModel;
  }
}
