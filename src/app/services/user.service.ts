import {Injectable, signal, Signal} from '@angular/core';
import {BehaviorSubject, map, Observable, tap, zip} from "rxjs";
import {User} from "../models/user";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {environment} from "../../environments/environment";

import {CognitoJwtVerifier} from "aws-jwt-verify";
import {filter} from "rxjs/operators";
import {formatDate} from "@angular/common";
import {MessageService} from "primeng/api";
import {LocalStorageService} from "./local-storage.service";


@Injectable({
    providedIn: 'root'
})
export class UserService {
    private initialAuthSetup: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    private authenticationCode: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
    private accessToken: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
    private idToken: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
    private refreshToken: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
    private userProfile: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
    private authenticatedUser: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);

    private cognitoIdVerifier: CognitoJwtVerifier<any, any, any>;

    private userJwtExpiry: BehaviorSubject<Date | null> = new BehaviorSubject<Date | null>(null);

    getUserJwtExpiry(): Observable<Date | null> {
        return this.userJwtExpiry.asObservable();
    }

    constructor(private httpClient: HttpClient, public messageService: MessageService, public localStorageService: LocalStorageService) {
        this.cognitoIdVerifier = CognitoJwtVerifier.create({
            userPoolId: environment.cognitoUserPoolId,
            tokenUse: 'id',
            clientId: environment.cognitoClientId,
            // scope: environment.cognitoClientScopes,
        });

        // this.cognitoIdVerifier.cacheJwks('us-east-2_T2fTJGzBP');

        this.authenticationCode.subscribe(authCode => this.convertCodeForJwt(authCode));
        this.idToken.pipe(
            filter((token) => !!token) // don't update user profile info if the token pushed is null
        ).subscribe(token => this.getUserProfileInfo(token));

        let localToken = this.localStorageService.getItem(environment.localJwtIdKey);
        if (localToken) {
            this.idToken.next(localToken);
        } else {
            console.log('no local token: auth setup complete.');
            this.initialAuthSetup.next(true);
        }

        let refreshToken = this.localStorageService.getItem(environment.localJwtRefreshKey);
        if (refreshToken) {
            this.refreshToken.next(refreshToken);
            this.processRefreshToken();
        }
    }

    clearSession(): void {
        console.warn('!********** Clearing User Session');
        this.authenticationCode.next('');
        this.idToken.next(null);
        this.idToken.next(null);
        this.localStorageService.removeItem(environment.localJwtIdKey);
        this.localStorageService.removeItem(environment.localJwtAccessKey);
    }

    public registerAuthenticationCode(code: string) {
        this.authenticationCode.next(code);
    }

    private convertCodeForJwt(code: string | null) {
        // console.log('convert code for jwt:', code);

        if (!code) {
            return;
        }

        let url = environment.cognitoIdpUrl + '/oauth2/token';
        const body = new URLSearchParams();
        body.set('grant_type', 'authorization_code');
        body.set('client_id', environment.cognitoClientId);
        body.set('redirect_uri', environment.cognitoCallbackUrl);
        body.set('scope', environment.cognitoClientScopes);
        body.set('code', code);

        // let auth = Buffer.from(`${environment.cognitoClientId}:${environment.cognitoClientSecret}`).toString('base64');
        // console.log('buffered up: ', auth);

        let headers: HttpHeaders = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded');
        // headers = headers.set('Authentication', 'Basic ' + auth);

        const options = {
            headers: headers
        }
        this.httpClient.post<any>(url, body.toString(), options).subscribe(response => {
            console.log('convertCodeForJwt response', response);

            if (response?.refresh_token) {
                this.refreshToken.next(response.refresh_token);
                this.localStorageService.setItem(environment.localJwtRefreshKey, response.refresh_token);
            }
            if (response?.id_token) {
                // console.log('jwtDecode(idToken):', jwtDecode(response.id_token));
                this.idToken.next(response.id_token);
                this.localStorageService.setItem(environment.localJwtIdKey, response.id_token);
            }
            if (response?.access_token) {
                // console.log('jwtDecode(accessIdToken):', jwtDecode(response.id_token));
                // console.log('pushing access token: ', this.localJwtIdKey, typeof response.access_token);
                this.accessToken.next(response.access_token);
                this.localStorageService.setItem(environment.localJwtAccessKey, response.access_token);
                // window.localStorage.setItem('teststorage', response.access_token);
                // this.getUserInfoByAccessToken(response.access_token);
            }
        });
    }

    getUserProfileInfo(token: string | null) {
        if (!token) {
            console.log('ClearingSession: getUserProfileInfo return due to empty token');
            this.clearSession();
            console.log('ibid: auth setup complete.');
            this.initialAuthSetup.next(true);
            return;
        }

        let newlyAuthedUser = new User();
        // let decodedIdToken = jwtDecode(token, {});
        // console.log('decodedIdToken', decodedIdToken);

        this.cognitoIdVerifier.verify(token).then((decodedIdToken: any) => {
                if (!decodedIdToken?.sub) {
                    throw new Error('Invalid idToken in setup authenticated user.');
                }

                newlyAuthedUser.sub = decodedIdToken.sub;
                newlyAuthedUser.emailVerified = decodedIdToken.email_verified;
                newlyAuthedUser.birthdate = decodedIdToken.birthdate ? new Date(decodedIdToken.birthdate.split('-')) : null;

                console.log(`decodedIdToken.birthdate: ${decodedIdToken.birthdate}`);
                console.log(`newlyAuthedUser.birthdate: ${newlyAuthedUser.birthdate}`);

                newlyAuthedUser.gender = decodedIdToken.gender;
                // newlyAuthedUser.insurance = decodedIdToken.insurance;

                if (decodedIdToken.hasOwnProperty('family_name')) {
                    newlyAuthedUser.familyName = decodedIdToken['family_name'];
                }
                if (decodedIdToken.hasOwnProperty('given_name')) {
                    newlyAuthedUser.givenName = decodedIdToken['given_name'];
                }
                if (decodedIdToken.hasOwnProperty('address')) {
                    newlyAuthedUser.address = decodedIdToken['address']?.formatted;
                }
                if (decodedIdToken.hasOwnProperty('custom:insurance')) {
                    newlyAuthedUser.insurance = decodedIdToken['custom:insurance'];
                }
                if (decodedIdToken.hasOwnProperty('custom:zip_code')) {
                    newlyAuthedUser.zipcode = decodedIdToken['custom:zip_code'];
                }

                // console.log('decoded:', decodedIdToken);
                // console.log('decoded.exp', decodedIdToken.exp);
                this.userJwtExpiry.next(new Date(decodedIdToken.exp));
                // console.log('decoded.exp', this.userJwtExpiry);

                // console.log('nexting the newlyAuthedUser:', newlyAuthedUser);
                this.authenticatedUser.next(newlyAuthedUser);
            }
        ).finally(() => {
            console.log('JWT Verify Finally: auth setup complete.');
            this.initialAuthSetup.next(true);
        });
    }

    processRefreshToken() {
        let refreshToken = this.localStorageService.getItem(environment.localJwtRefreshKey);
        if (!refreshToken) {
            console.log('NO REFRESH TOKEN!');
            return;
        }

        let url = environment.cognitoIdpUrl + '/oauth2/token';
        const body = new URLSearchParams();
        body.set('grant_type', 'refresh_token');
        body.set('client_id', environment.cognitoClientId);
        body.set('redirect_uri', environment.cognitoCallbackUrl);
        body.set('refresh_token', refreshToken);

        let headers: HttpHeaders = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded');
        const options = {
            headers: headers
        }
        this.httpClient.post<any>(url, body, options).subscribe(response => {
            console.log('oauth2/token refresh response', response);

            if (response?.id_token) {
                // console.log('jwtDecode(idToken):', jwtDecode(response.id_token));
                this.idToken.next(response.id_token);
                this.localStorageService.setItem(environment.localJwtIdKey, response.id_token);
            }
            if (response?.access_token) {
                // console.log('jwtDecode(accessIdToken):', jwtDecode(response.id_token));
                // console.log('pushing access token: ', this.localJwtIdKey, typeof response.access_token);
                this.accessToken.next(response.access_token);
                this.localStorageService.setItem(environment.localJwtAccessKey, response.access_token);
            }
        });
    }

    updateUser(user: User) {
        let url = environment.apiGatewayDomain + '/api/profile';

        let idToken = this.localStorageService.getItem(environment.localJwtIdKey);
        if (!idToken) {
            console.log('Failed to load idToken in updateUser');
            return;
        }

        let headers: HttpHeaders = new HttpHeaders().set('Authorization', idToken)
        const options = {
            headers: headers
        }


        let body = {
            "birthdate": user.birthdate ? formatDate(user.birthdate, 'yyyy-MM-dd', 'en-US') : null,
            "givenName": user.givenName,
            "familyName": user.familyName,
            "gender": user.gender,
            "zipcode": user.zipcode,
            "insurance": user.insurance ? user.insurance : 'TBD'
        };

        this.httpClient.post<any>(url, body, options).subscribe((response: any) => {
            // console.log("response!", response.ok, response);
            // console.log('nexting user!:', user.givenName, user);

            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Profile updated successfully.',
            });

            this.processRefreshToken();
        });

    }

    getAuthenticatedUserObservable(): Observable<User | null> {
        return zip([this.initialAuthSetup, this.authenticatedUser])
            .pipe(
                // tap(([auth, user]) => console.log('pre tapping getAuthUserObs:', auth, user)),
                filter(([auth, user], index) => !!auth),
                map(([auth, user], index) => {
                    return user;
                }),
                // tap((user) => console.log('post tapping getAuthUserObs:', user)),
            );
    }

    getIsAuthenticatedObservable(): Observable<boolean> {
        return this.getAuthenticatedUserObservable().pipe(
            map((user) => {
                return !!user?.sub;
            }),
        );
    }

    getIsProfileCompletedObservable(): Observable<boolean> {
        return this.getAuthenticatedUserObservable().pipe(
            map((user) => {
                return !!user?.sub && !!user?.givenName
            }),
        );
    }

    storeUserInLocalStorage(user: User) {
        // localStorage.setItem('PKPM_USER_RECORD', JSON.stringify(user));
    }

    getIdToken(): Observable<string | null> {
        return this.idToken.asObservable();
    }

}
