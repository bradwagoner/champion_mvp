import {Pipe, PipeTransform} from '@angular/core';
import {ApiListResponse} from "../models/api-list-response";
import {Converter} from "aws-sdk/clients/dynamodb";

@Pipe({
  name: 'jsonUnmarshaller',
  standalone: true
})
export class JsonUnmarshallerPipe implements PipeTransform {

  transform(apiListResponse: ApiListResponse<T> | null): T[] {
    if (!apiListResponse) {
      return [];
    }

    return apiListResponse?.Items?.map(mapItem => Converter.unmarshall(mapItem) as T)
  }

}
