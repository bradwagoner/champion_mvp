import {Component, EventEmitter, HostListener, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {JointEnum} from "../../../models/ref/joint-enum";
import {EnumToStringPipe} from "../../../pipes/util/enum-to-titlecase.pipe";

@Component({
  selector: 'app-joint',
  standalone: true,
  imports: [CommonModule, EnumToStringPipe],
  templateUrl: './joint.component.html',
  styleUrl: './joint.component.scss'
})
export class JointComponent {
  @HostListener('click') handleHostClick() {
    if (!this.joint) {
      return;
    }

    this.jointSelection.emit(this.joint);
  }

  @Input()
  public joint: JointEnum;

  @Output()
  public jointSelection: EventEmitter<JointEnum> = new EventEmitter();
}
