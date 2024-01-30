import {CanActivateFn, CanMatchFn} from '@angular/router';
import {UserService} from "../services/user.service";
import {inject} from "@angular/core";
import {filter, take, timeout} from "rxjs/operators";
import {tap} from "rxjs";

export const isAuthenticatedGuard: CanMatchFn = (route, state) => {
  return inject(UserService).getIsAuthenticatedObservable().pipe(
    tap(auth => console.log('pre auth tap', auth)),
    filter(isAuthenticated => isAuthenticated),
    tap(auth => console.log('pre auth tap', auth)),
    take(1),
    timeout(100)
  );
};
