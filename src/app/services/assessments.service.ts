import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {CookieService} from "ngx-cookie-service";
import {BehaviorSubject, map, Observable} from "rxjs";
import {Assessment} from "../models/assessment";
import {ApiListResponse} from "../models/api-list-response";
import {environment} from "../../environments/environment";
import {User} from "../models/user";
import {take} from "rxjs/operators";
import {JointEnum} from "../models/ref/joint-enum";

@Injectable({
  providedIn: 'root'
})
export class AssessmentsService {
  private myAssessmentsBs: BehaviorSubject<Assessment[]> = new BehaviorSubject<Assessment[]>([] as Assessment[]);

  private inProgressAssessment: Assessment;

  constructor(private httpClient: HttpClient,
              private cookieService: CookieService,
  ) {
    let cachedAssessments = this.cookieService.get('assessments');
    if (cachedAssessments) {
      this.myAssessmentsBs.next(JSON.parse(cachedAssessments));
    }
  }

  getInProgressAssessment(): Assessment {
    return this.inProgressAssessment;
  }

  setInProgressAssessment(assessment: Assessment): void {
    this.inProgressAssessment = assessment;
  }

  public fetchAssessments() {
    console.log('calling fetchAssessments');

    let idToken = this.cookieService.get(environment.localJwtIdKey);
    let headers: HttpHeaders = new HttpHeaders({
      'Authorization': idToken,
    });
    this.httpClient.get<Assessment[]>(environment.cloudfrontDomain + '/api/assessments', {
      headers: headers
    }).subscribe((mappedResponse: Assessment[]) => {
      console.log('fetchAssessments Get subscribe callback: ', mappedResponse);
      this.myAssessmentsBs.next(mappedResponse);
      this.cookieService.set('assessments', JSON.stringify(mappedResponse));
    });
  }


  saveAssessment(assessment: Assessment) {
    let url = environment.cloudfrontDomain + '/api/assessments';

    let idToken = this.cookieService.get(environment.localJwtIdKey);
    let headers: HttpHeaders = new HttpHeaders().set('Authorization', idToken)
    const options = {
      headers: headers
    }

    let body: any = {
      "joint": assessment.joint,
      "motion": assessment.motion,
    };
    if (assessment.rangeOfMotion) {
      body.rangeOfMotion = assessment.rangeOfMotion
    }

    this.httpClient.post<any>(url, body, options).subscribe((response: any) => {
      // console.log("response!", response.ok, response);
      // console.log('nexting assessment!:', assessment);
      this.myAssessmentsBs.asObservable().pipe(take(1)).subscribe((assessments: Assessment[]) => {
        assessment.dateCreated = new Date();
        assessments.push(assessment);
        this.myAssessmentsBs.next(assessments);
        this.cookieService.set('assessments', JSON.stringify(assessments));
      });
    });

  }

  public getMyAssessmentsAsObservable() {
    return this.myAssessmentsBs.asObservable();
  }
}
