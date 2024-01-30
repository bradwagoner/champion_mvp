import {CanMatchFn} from '@angular/router';
import {UserService} from "../services/user.service";
import {inject} from "@angular/core";
import {catchError, take, timeout} from "rxjs/operators";
import {tap} from "rxjs";
import {AsyncPipe} from "@angular/common";

export const isProfileCompletedGuard: CanMatchFn = (route, state) => {

  return inject(UserService).getIsProfileCompletedObservable()
    .pipe(
      take(1),
      timeout({
        first: 100,
        each: 20
      }),
      // tap(complete => console.log('ProfileComplete?', complete)),
      catchError((err, caught) => {
        // console.log('caught!:', caught);
        return caught;
      })
    );

};
