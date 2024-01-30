import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {User} from "../../../models/user";
import {UserService} from "../../../services/user.service";
import {Observable} from "rxjs";
import {RouterModule} from "@angular/router";
import {environment} from "../../../../environments/environment";
import {UserProfileCompletePipe} from "../../../pipes/user-profile-complete.pipe";
import {isProfileCompletedGuard} from "../../../guards/is-user-profile-complete";
import {DividerModule} from "primeng/divider";
import {ButtonModule} from "primeng/button";

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule, UserProfileCompletePipe, ButtonModule],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
})
export class NavigationComponent {

  private userService: UserService;

  public testingEnvironment: boolean = environment.environmentName == 'Local';

  public authenticatedUser: Observable<User | null>;
  public isUserAuthenticated: Observable<boolean>;
  public userProfileComplete: Observable<boolean>;

  constructor(iUserService: UserService) {

    this.userService = iUserService;
    this.authenticatedUser = this.userService.getAuthenticatedUserObservable();
    this.isUserAuthenticated = this.userService.getIsAuthenticatedObservable();
    this.userProfileComplete = this.userService.getIsProfileCompletedObservable();
  }

  protected readonly isProfileCompletedGuard = isProfileCompletedGuard;
}
