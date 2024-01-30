import {Component} from '@angular/core';
import {UserService} from "../../../services/user.service";
import {Observable} from "rxjs";
import {environment} from "../../../../environments/environment";
import {CommonModule} from "@angular/common";
import {RouterModule} from "@angular/router";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  // providers: [UserService]
})
export class HomeComponent {

  private userService: UserService;
  public isUserAuthenticated: Observable<boolean>;
  public isUserProfileCompleted: Observable<boolean>;

  public registrationUrl: string = environment.cognitoIdpUrl;

  constructor(iUserService: UserService) {

    this.userService = iUserService;
    this.isUserAuthenticated = this.userService.getIsAuthenticatedObservable();
    this.isUserProfileCompleted = this.userService.getIsProfileCompletedObservable();
  }

}
