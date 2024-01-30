import {Injectable} from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {Questionnaire} from "../models/questionnaire";
import {environment} from "../../environments/environment";
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {take} from "rxjs/operators";
import {Assessment} from "../models/assessment";
import {UserService} from "./user.service";

@Injectable({
  providedIn: 'root'
})
export class QuestionnaireService {

  private myQuestionnairesBs: BehaviorSubject<Questionnaire[]> = new BehaviorSubject<Questionnaire[]>([] as Questionnaire[]);

  constructor(public httpClient: HttpClient, public userService: UserService) {
  }

  getMyQuestionnaires() {
    return this.myQuestionnairesBs.asObservable();
  }

  // untested
  refreshMyQuestionnaires() {
    console.log('calling refreshMyQuestionnaires');

    this.userService.getIdToken().subscribe((token) => {
      if (token) {
        let headers: HttpHeaders = new HttpHeaders({
          'Authorization': token,
        });
        this.httpClient.get<Questionnaire[]>(environment.cloudfrontDomain + '/api/questionnaires', {
          headers: headers
        }).subscribe((mappedResponse: Questionnaire[]) => {
          console.log('fetchQuestionnaires Get subscribe callback: ', mappedResponse);
          this.myQuestionnairesBs.next(mappedResponse);
        });
      }
    });
  }

  saveQuestionnaire(questionnaire: Questionnaire) {
    console.log('saving questionnaire: ', questionnaire);

    let url = environment.cloudfrontDomain + '/api/questionnaires';

    this.userService.getIdToken().subscribe((token) => {
      if (token) {
        let headers: HttpHeaders = new HttpHeaders().set('Authorization', token)
        const options = {
          headers: headers
        }

        let body: any = {
          "joint": questionnaire.joint,
          "assessmentIds": questionnaire.assessmentIds,
          "experiencedPain": questionnaire.experiencedPain,
          "experiencedWeakness": questionnaire.experiencedWeakness,
          "avoidedOrUnable": questionnaire.avoidedOrUnable,
          "recentImprovement": questionnaire.recentImprovement,
          "disruptsSleep": questionnaire.disruptsSleep
        };

        this.httpClient.post<any>(url, body, options).subscribe((response: any) => {
          console.log("response!", response.ok, response);

          this.refreshMyQuestionnaires();
        });
      }
    });
  }
}
