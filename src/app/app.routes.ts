import {Routes} from '@angular/router';
import {HomeComponent} from "./components/container-components/home/home.component";
import {
  MyAssessmentsContainerComponent
} from "./components/container-components/assessments/my-assessments-container/my-assessments-container.component";
import {isProfileCompletedGuard} from "./guards/is-user-profile-complete";
import {isAuthenticatedGuard} from "./guards/is-authenticated.guard";
import {
  TakeAssessmentComponent
} from "./components/container-components/assessments/take-assessment/take-assessment.component";
import {
  MyQuestionnairesComponent
} from "./components/container-components/questionnaires/my-questionnaires/my-questionnaires.component";
import {
  QuestionnaireFormComponent
} from "./components/container-components/questionnaires/questionnaire-form/questionnaire-form.component";
import {ProfileComponent} from "./components/container-components/profile/profile.component";
import {
  MyAssessmentsComponent
} from "./components/container-components/assessments/my-assessments/my-assessments.component";

export const routes: Routes = [
  {path: '', component: HomeComponent},
  {path: 'home', component: HomeComponent},

  {path: 'profile', component: ProfileComponent, canMatch: [isAuthenticatedGuard]},

  {path: 'screenings', component: MyAssessmentsComponent, canMatch: [isProfileCompletedGuard]},
  {path: 'screenings/:joint', component: MyAssessmentsComponent, canMatch: [isProfileCompletedGuard]},

  {path: 'take-assessment', component: TakeAssessmentComponent, canMatch: [isProfileCompletedGuard]},
  {path: 'take-assessment/:joint', component: TakeAssessmentComponent, canMatch: [isProfileCompletedGuard]},

  {path: 'questionnaires', component: MyQuestionnairesComponent, canMatch: [isProfileCompletedGuard]},
  {path: 'questionnaireForm', component: QuestionnaireFormComponent, canMatch: [isProfileCompletedGuard]},

  // {path: 'clinics', component: ListClinicsComponent}

  {path: '**', redirectTo: ''}
];
