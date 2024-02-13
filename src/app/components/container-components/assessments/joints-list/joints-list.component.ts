import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {StaticDataService} from "../../../../services/static-data.service";
import {JointComponent} from "../../../display-components/joint/joint.component";
import {FindRefArrayByCodePipe} from "../../../../pipes/filter-ref-array-by-code.pipe";
import {JointEnum} from "../../../../models/ref/joint-enum";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {SelectButtonModule} from "primeng/selectbutton";
import {PanelModule} from "primeng/panel";
import {CardModule} from "primeng/card";
import {DividerModule} from "primeng/divider";

@Component({
    selector: 'app-joints-list',
    standalone: true,
    imports: [CommonModule, JointComponent, FindRefArrayByCodePipe, SelectButtonModule, PanelModule, CardModule, DividerModule],
    templateUrl: './joints-list.component.html',
    styleUrl: './joints-list.component.scss'
})
export class JointsListComponent {

    leftRightOptions: any[] = [{label: 'Left', value: 'left'}, {label: 'Right', value: 'right'}];
    public joints: JointEnum[];


    constructor(private staticDataService: StaticDataService, public router: Router, public activatedRoute: ActivatedRoute) {
        this.joints = staticDataService.getJoints();
    }

    handleJointSelection(joint: JointEnum) {
        this.router.navigate(
            [],
            {
                fragment: joint,
                relativeTo: this.activatedRoute,
            }
        );

        this.staticDataService.setSelectedJoint(joint);
    }

    protected readonly JointEnum = JointEnum;
    protected readonly StaticDataService = StaticDataService;
}
