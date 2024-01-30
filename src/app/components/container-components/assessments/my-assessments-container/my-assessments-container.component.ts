import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {JointsListComponent} from "../joints-list/joints-list.component";
import {ActivatedRoute} from "@angular/router";
import {BreakpointObserver, Breakpoints, BreakpointState} from "@angular/cdk/layout";
import {Observable, tap} from "rxjs";
import {MyAssessmentsComponent} from "../my-assessments/my-assessments.component";
import {StaticDataService} from "../../../../services/static-data.service";
import {JointEnum} from "../../../../models/ref/joint-enum";

@Component({
  selector: 'app--container',
  standalone: true,
  imports: [CommonModule, JointsListComponent, MyAssessmentsComponent],
  templateUrl: './my-assessments-container.component.html',
  styleUrl: './my-assessments-container.component.scss'
})
export class MyAssessmentsContainerComponent {

  public selectedJoint: Observable<JointEnum | null>;

  combinedBreakpoint: Observable<BreakpointState>;
  individualBreakpoint: Observable<BreakpointState>;

  constructor(breakpointObserver: BreakpointObserver, public staticDataService: StaticDataService, public activatedRoute: ActivatedRoute) {
    this.selectedJoint = staticDataService.getSelectedJoint();
    this.combinedBreakpoint = breakpointObserver.observe([
      Breakpoints.Large,
      Breakpoints.XLarge,
    ]);
    this.individualBreakpoint = breakpointObserver.observe([
      Breakpoints.Medium,
      Breakpoints.Small,
      Breakpoints.XSmall,
    ]);

    activatedRoute.fragment
      .pipe(
        tap((fragment) => {
          this.staticDataService.setSelectedJoint((fragment as JointEnum) || null);
        })
      )
      .subscribe()
  }
}
