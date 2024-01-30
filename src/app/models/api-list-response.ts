import {Converter} from "aws-sdk/clients/dynamodb";

export class ApiListResponse<T> {
  Count: number;
  ScannedCount: number;

  Items: any[];

  static getTypedObjectArray<T>(items: any[]): T[]  {
    return items.map(mapItem => Converter.unmarshall(mapItem) as T)
  }
}
