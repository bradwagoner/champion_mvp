import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {environment} from "../../../environments/environment";

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {

  environemntNmae: string = environment.environmentName;

}
