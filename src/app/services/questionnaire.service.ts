import {Injectable} from '@angular/core';
import {BehaviorSubject, map} from "rxjs";
import {Questionnaire} from "../models/questionnaire";
import {environment} from "../../environments/environment";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {UserService} from "./user.service";
import {MessageService} from "primeng/api";
import {LocalStorageService} from "./local-storage.service";

@Injectable({
  providedIn: 'root'
})
export class QuestionnaireService {

  private myQuestionnairesBs: BehaviorSubject<Questionnaire[]> = new BehaviorSubject<Questionnaire[]>([] as Questionnaire[]);

  constructor(public httpClient: HttpClient, public userService: UserService, public messageService: MessageService, public localStorageService: LocalStorageService) {
    let cachedQuestionnaires = this.localStorageService.getItem('questionnaires');
    if (cachedQuestionnaires) {
      this.myQuestionnairesBs.next(JSON.parse(cachedQuestionnaires));
    }
  }

  getMyQuestionnaires() {
    return this.myQuestionnairesBs.asObservable().pipe(
        map(questionnaires => {
          return questionnaires.sort((a, b) => a.dateCreated > b.dateCreated ? -1 : 1);
        })
    );
  }

  // untested
  refreshMyQuestionnaires() {
    console.log('calling refreshMyQuestionnaires');

    this.userService.getIdToken().subscribe((token) => {
      if (token) {
        let headers: HttpHeaders = new HttpHeaders({
          'Authorization': token,
        });
        this.httpClient.get<Questionnaire[]>(environment.apiGatewayDomain + '/api/questionnaires', {
          headers: headers
        }).subscribe((mappedResponse: Questionnaire[]) => {
          console.log('fetchQuestionnaires Get subscribe callback: ', mappedResponse);

          this.myQuestionnairesBs.next(mappedResponse);
          this.localStorageService.setItem('questionnaires', JSON.stringify(mappedResponse));
        });
      }
    });
  }

  saveQuestionnaire(questionnaire: Questionnaire) {
    console.log('saving questionnaire: ', questionnaire);

    let url = environment.apiGatewayDomain + '/api/questionnaires';

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

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Questionnaire saved successfully.',
          })

          this.refreshMyQuestionnaires();
        });
      }
    });
  }
}
