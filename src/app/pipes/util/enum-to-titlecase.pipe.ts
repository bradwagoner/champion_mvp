import {Pipe, PipeTransform} from '@angular/core';
import {TitleCasePipe} from "@angular/common";

@Pipe({
  name: 'enumToString',
  standalone: true
})
export class EnumToStringPipe implements PipeTransform {

  transform(value: string | null | undefined): string | null {
    if (!value?.replaceAll) {
      console.warn('Unable to parse unexpected input: ', value);
      return null;
    }
    return value.replaceAll('_', ' ');
  }

}
