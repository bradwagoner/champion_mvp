import {Pipe, PipeTransform} from '@angular/core';
import {User} from "../models/user";

@Pipe({
  name: 'userProfileComplete',
  standalone: true
})
export class UserProfileCompletePipe implements PipeTransform {

  transform(user: User | null): boolean {
    console.log("UserProfileCompletePipe:", user);
    return !!user?.sub &&
      !!user?.givenName
  }

}
