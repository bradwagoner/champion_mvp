import {Component} from '@angular/core';
import {AsyncPipe, CommonModule, TitleCasePipe} from '@angular/common';
import {AssessmentsService} from "../../../../services/assessments.service";
import {Observable, tap} from "rxjs";
import {Assessment} from "../../../../models/assessment";
import {UserService} from "../../../../services/user.service";
import {JointsListComponent} from "../joints-list/joints-list.component";
import {MotionComponent} from "../../../display-components/motion/motion.component";
import {StaticDataService} from "../../../../services/static-data.service";
import {JointEnum} from "../../../../models/ref/joint-enum";
import {EnumToStringPipe} from "../../../../pipes/util/enum-to-titlecase.pipe";
import {ButtonModule} from "primeng/button";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {select} from "@tensorflow/tfjs-backend-webgl/dist/kernels/Select";
import {MotionEnum} from "../../../../models/ref/motion-enum";
import {FilterAssessmentsByJointPipe} from "../../../../pipes/assessment/filter-assessments-by-joint.pipe";
import {FilterAssessmentsByMotionPipe} from "../../../../pipes/assessment/filter-assessments-by-motion.pipe";
import {MostRecentAssessment} from "../../../../pipes/assessment/most-recent-assessmentx.pipe";
import {MenuItem, PrimeIcons} from "primeng/api";
import {SplitButtonModule} from "primeng/splitbutton";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {DialogModule} from "primeng/dialog";
import {SafeResourceUrl} from "@angular/platform-browser";


@Component({
    selector: 'app-my-assessments',
    standalone: true,
    providers: [AsyncPipe],
    imports: [CommonModule, JointsListComponent, MotionComponent, EnumToStringPipe, ButtonModule, FilterAssessmentsByJointPipe, FilterAssessmentsByMotionPipe, MostRecentAssessment, SplitButtonModule, OverlayPanelModule, DialogModule],
    templateUrl: './my-assessments.component.html',
    styleUrl: './my-assessments.component.scss',
    // providers: [UserService]
})
export class MyAssessmentsComponent {

    private userService: UserService;

    public myAssessments: Observable<Assessment[]>;

    public selectedJoint: Observable<JointEnum | null>;
    public nonNullSelectedJoint: JointEnum;

    public enumToPipeString = new EnumToStringPipe();
    public titleCasePipe = new TitleCasePipe();

    public visible: boolean = false;
    public videoUrl: SafeResourceUrl | null = null;

    constructor(public assessmenctService: AssessmentsService, userService: UserService, public staticDataService: StaticDataService, public router: Router, public activatedRoute: ActivatedRoute, asyncPipe: AsyncPipe) {
        this.userService = userService;
        this.myAssessments = assessmenctService.getMyAssessmentsAsObservable();

        this.selectedJoint = staticDataService.getSelectedJoint();

        // assessmenctService.fetchAssessments();

        // todo ? should be filter/map into Observable<JointEnum> (sans null)
        this.selectedJoint
            .subscribe((joint) => {
                if (joint) {
                    this.nonNullSelectedJoint = joint;
                }
            });

        activatedRoute.fragment.subscribe((fragment) => this.staticDataService.setSelectedJoint(fragment as JointEnum));
    }

    getJointButtonOptions(): MenuItem[] {
        return Object.keys(JointEnum).map((joint) => {
            return <MenuItem>{
                label: this.titleCasePipe.transform(this.enumToPipeString.transform(joint)),
            }
        })
    }

    handleBackClick() {
        this.staticDataService.setSelectedJoint(null);
        const params: Params = {joint: null};
        this.router.navigate(
            [],
            {
                relativeTo: this.activatedRoute,
                queryParams: params,
                queryParamsHandling: 'merge', // remove to replace all query params by provided
            }
        );
    }

    handleMotionSelection(motion: MotionEnum) {
        let assessment = new Assessment();
        assessment.motion = motion;
        assessment.joint = this.nonNullSelectedJoint;
        this.assessmenctService.setInProgressAssessment(assessment);

        this.router.navigate(['take-assessment']);
    }

    handlePlayVideo(videoUrl: SafeResourceUrl) {
        console.log('HandlePlayVideo!', this.visible, videoUrl);

        this.visible = true;
        this.videoUrl = videoUrl;
    }

    completeAssessment() {
        this.router.navigate(['/questionnaireForm'], {
            fragment: this.nonNullSelectedJoint
        });
    }

    protected readonly select = select;
    protected readonly PrimeIcons = PrimeIcons;
    protected readonly JointEnum = JointEnum;
    protected readonly Object = Object;
}
