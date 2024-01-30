import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {UserService} from "../../../services/user.service";
import {User} from "../../../models/user";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {filter, take} from "rxjs/operators";
import {CalendarModule} from "primeng/calendar";
import {InputTextModule} from "primeng/inputtext";
import {ButtonModule} from "primeng/button";
import {InputMaskModule} from "primeng/inputmask";

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CalendarModule, InputTextModule, ButtonModule, InputMaskModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {

  private userService: UserService;
  public user: User;

  // public parsedBirthdate: Date;

  constructor(userService: UserService) {
    this.userService = userService;
    this.userService.getAuthenticatedUserObservable().pipe(
      filter<User | null>(user => !!user?.sub),
      take(1)
    ).subscribe((user: User | null) => {
      if (!user) {
        throw Error('Invalid  user in ProfileComponent');
      }

      // this.parsedBirthdate = Date.parse(this.user.birthdate);
      console.log('constructor w/user:', user.birthdate, typeof user.birthdate);
      this.user = user;
    });
  }

  submit() {
    this.userService.updateUser(this.user);
  }

}
