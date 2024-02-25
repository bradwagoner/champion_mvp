import {afterNextRender, afterRender, EventEmitter, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {BehaviorSubject} from "rxjs";
import {Assessment} from "../models/assessment";
import {environment} from "../../environments/environment";
import {take} from "rxjs/operators";
import {MessageService} from "primeng/api";
import {LocalStorageService} from "./local-storage.service";
import {Pose} from "@tensorflow-models/pose-detection";

@Injectable({
    providedIn: 'root'
})
export class AssessmentsService {
    private myAssessmentsBs: BehaviorSubject<Assessment[]> = new BehaviorSubject<Assessment[]>([] as Assessment[]);

    private inProgressAssessment: Assessment;

    private poseEmitter: EventEmitter<Pose> = new EventEmitter();

    constructor(private httpClient: HttpClient, public messageService: MessageService, public localStorageService: LocalStorageService) {
        let cachedAssessments = localStorageService.getItem('assessments');
        if (cachedAssessments) {
            this.myAssessmentsBs.next(JSON.parse(cachedAssessments));
            console.log('nexting cached asses:", ', JSON.parse(cachedAssessments));
        }
    }

    getInProgressAssessment(): Assessment {
        return this.inProgressAssessment;
    }

    setInProgressAssessment(assessment: Assessment): void {
        this.inProgressAssessment = assessment;
    }

    public trackPose(pose: Pose) {
        this.poseEmitter.emit(pose);
    }

    public getPoses() {
        return this.poseEmitter.asObservable();
    }

    public fetchAssessments() {
        console.log('calling fetchAssessments');

        // let idToken = localStorageService.getItem(environment.localJwtIdKey);
        // if (!idToken) return;

        let idToken = this.localStorageService.getItem(environment.localJwtIdKey);
        if (!idToken) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Something went wrong trying to save the screening.',
                detail: 'It looks like you might not be logged in, try refreshing and retrying. Sorry for the inconvenience.',
                sticky: true
            });
            return;
        }

        let headers: HttpHeaders = new HttpHeaders({
            'Authorization': idToken,
        });
        this.httpClient.get<Assessment[]>(environment.apiGatewayDomain + '/api/assessments', {
            headers: headers
        }).subscribe((mappedResponse: Assessment[]) => {
            console.log('fetchAssessments Get subscribe callback: ', mappedResponse);
            this.myAssessmentsBs.next(mappedResponse);
            // this.cookieService.set('assessments', JSON.stringify(mappedResponse));
            this.localStorageService.setItem('assessments', JSON.stringify(mappedResponse));
        });
    }


    saveAssessment(assessment: Assessment) {
        let url = environment.apiGatewayDomain + '/api/assessments';

        let idToken = this.localStorageService.getItem(environment.localJwtIdKey);

        if (!idToken) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Something went wrong trying to save the screening.',
                detail: 'It looks like you might not be logged in, try refreshing and retrying. Sorry for the inconvenience.',
                sticky: true
            });

            return;
        }

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
            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Screening saved successfully.'
            });
            this.myAssessmentsBs.asObservable().pipe(take(1)).subscribe((assessments: Assessment[]) => {
                this.fetchAssessments();
            });
        });

    }

    public getMyAssessmentsAsObservable() {
        return this.myAssessmentsBs.asObservable();
    }
}
