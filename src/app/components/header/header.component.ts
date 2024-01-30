import {Component} from '@angular/core';
import {CommonModule} from "@angular/common";
import {RouterModule, RouterOutlet} from "@angular/router";
import {UserService} from "../../services/user.service";
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Observable} from "rxjs";
import {environment} from "../../../environments/environment";
import {NavigationComponent} from "../display-components/navigation/navigation.component";
import {ButtonModule} from "primeng/button";
import {User} from "../../../app/models/user";
import {InputTextModule} from "primeng/inputtext";
import {URLSearchParams} from "url";
import {HttpParams} from "@angular/common/http";
import {filter} from "rxjs/operators";

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FormsModule, ReactiveFormsModule, RouterModule, NavigationComponent, ButtonModule, InputTextModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {

  public applicationTitle: string = environment.applicationTitle;
  public loginRoute = environment.cognitoIdpUrl + '/oauth2/authorize';
  public logoutRoute = environment.cognitoIdpUrl + '/logout';
  public testingEnvironment = environment.environmentName == 'Local';

  public loginLink: string = environment.cognitoIdpUrl;

  public isUserAuthenticated: Observable<boolean>;
  public authenticatedUser: Observable<User | null>;

  constructor(private userService: UserService) {
    this.isUserAuthenticated = this.userService.getIsAuthenticatedObservable();
    this.authenticatedUser = this.userService.getAuthenticatedUserObservable();

    let loginParams = new HttpParams({
      fromObject: {
        client_id: environment.cognitoClientId,
        response_type: 'code',
        scope: environment.cognitoClientScopes,
        redirect_uri: environment.cognitoCallbackUrl,
      }
    });
    this.loginRoute += '?' + loginParams.toString();

    let logoutParams = new HttpParams({
      fromObject: {
        client_id: environment.cognitoClientId,
        // response_type: 'code',
        // redirect_uri: environment.cognitoCallbackUrl,
        logout_uri: environment.cognitoCallbackUrl,
      }
    });

    this.logoutRoute += '?' + logoutParams.toString();
    return;

    let paramssad = new URLSearchParams({
      client_id: environment.cognitoClientId,
      response_type: 'code',
      scope: 'openid profile aws.cognito.signin.user.admin',
      redirect_uri: environment.cognitoCallbackUrl
    });


    let separator: string = '?';
    [
      `client_id=${environment.cognitoClientId}`,
      'response_type=code',
      'scope=openid profile aws.cognito.signin.user.admin',
      `redirect_uri=${environment.cognitoCallbackUrl}`
    ].forEach(param => {
      this.loginRoute += separator + param;
      this.logoutRoute += separator + param;
      separator = '&';
    });
  }

  login() {
    console.log('login route: ', this.loginRoute);
    window.open(this.loginRoute, '_self');
  }

  logout() {
    console.log('logout route: ', this.logoutRoute);
    this.userService.clearSession();
    window.open(this.logoutRoute, '_self');
  }
}
