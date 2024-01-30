import {Injectable} from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {Joint} from "../models/joint";
import {Motion} from "../models/motion";

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  private selectedJoint: BehaviorSubject<Joint | null> = new BehaviorSubject<Joint | null>(null);
  private selectedMotion: BehaviorSubject<Motion | null> = new BehaviorSubject<Motion | null>(null);

  constructor() {
  }

  selectJoint(joint: Joint) {
    this.selectedJoint.next(joint);
  }

  getSelectedJoint() {
    return this.selectedJoint.asObservable();
  }

  selectMotion(motion: Motion) {
    this.selectedMotion.next(motion);
  }

  getSelectedMotion() {
    return this.selectedMotion.asObservable();
  }
}
