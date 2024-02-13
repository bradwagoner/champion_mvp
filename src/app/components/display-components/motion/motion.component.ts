import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Assessment} from "../../../models/assessment";
import {FormsModule} from "@angular/forms";
import {ButtonModule} from "primeng/button";
import {KnobModule} from "primeng/knob";
import {PrimeIcons} from "primeng/api";
import {CardModule} from "primeng/card";
import {ImageModule} from "primeng/image";
import {FieldsetModule} from "primeng/fieldset";
import {MotionEnum} from "../../../models/ref/motion-enum";
import {StaticDataService} from "../../../services/static-data.service";
import {EnumToStringPipe} from "../../../pipes/util/enum-to-titlecase.pipe";
import {ActivatedRoute, Router} from "@angular/router";
import {JointEnum} from "../../../models/ref/joint-enum";
import {AssessmentsService} from "../../../services/assessments.service";
import {DialogModule} from "primeng/dialog";
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";

@Component({
    selector: 'app-motion',
    standalone: true,
    imports: [CommonModule, FormsModule, KnobModule, ButtonModule, CardModule, ImageModule, FieldsetModule, EnumToStringPipe, DialogModule],
    templateUrl: './motion.component.html',
    styleUrl: './motion.component.scss'
})
export class MotionComponent implements OnChanges {

    cameraView: string = 'Video Example';
    normalRange: string = 'normalRange?'

    rangeOfMotion: number | null = null;

    @Input()
    joint: JointEnum;

    @Input()
    motion: MotionEnum;

    @Input()
    assessment: Assessment | null;

    @Output()
    playVideo: EventEmitter<SafeResourceUrl> = new EventEmitter<SafeResourceUrl>();

    @Output()
    public motionSelection: EventEmitter<MotionEnum> = new EventEmitter();

    constructor(public assessmentService: AssessmentsService,
                public staticDataService: StaticDataService,
                public router: Router,
                public activatedRoute: ActivatedRoute,
                public sanitizer: DomSanitizer) {
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.rangeOfMotion = changes['assessment']?.currentValue?.rangeOfMotion;
        let dateCreated = changes['assessment']?.currentValue?.dateCreated;

        if (dateCreated) {
            dateCreated = new Date(Number(dateCreated));
            console.log("Date:", dateCreated?.toLocaleString());
        }

        console.log('dateCreated:', dateCreated);
    }

    handleMotionClick() {
        this.motionSelection.emit(this.motion);
        this.staticDataService.setSelectedMotion(this.motion);
    }

    saveManualRangeOfMotionSelection(rangeOfMotion: number | null) {
        // console.log('handleManualRangeOfMotionSelection:', arguments);
        if (!this.assessment) {
            this.assessment = new Assessment();
        }

        // console.log('value:', rangeOfMotion);

        this.assessment.motion = this.motion;
        this.assessment.joint = this.joint;
        this.assessment.rangeOfMotion = rangeOfMotion;
        // this.manualRangeOfMotionSelection.emit(this.assessment);
        this.assessmentService.saveAssessment(this.assessment);
        // console.log('ROM:', rangeOfMotion);
    }

    handleVideoImageClick(event: MouseEvent) {
        // console.log('handleVideoImageClick', arguments);

        const videoUrl = this.staticDataService.getVideoUrlForJointAndMotion(this.joint, this.motion);
        // console.log('video url:', videoUrl);
        if (videoUrl?.videoUrl) {
            const sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(videoUrl.videoUrl);
            // console.log('sanitized url:', sanitizedUrl);
            this.playVideo.emit(sanitizedUrl);
        }

    }

    protected readonly PrimeIcons = PrimeIcons;
}
