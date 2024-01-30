import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, NavigationCancel, Params, Router, RouterOutlet} from '@angular/router';
import {HeaderComponent} from "./components/header/header.component";
import {FooterComponent} from "./components/footer/footer.component";
import {UserService} from "./services/user.service";
import {NavigationComponent} from "./components/display-components/navigation/navigation.component";
import {ScrollPanelModule} from "primeng/scrollpanel";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, NavigationComponent, ScrollPanelModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit{

  constructor(private route: ActivatedRoute, private router: Router, private userService: UserService) {
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params: Params) => {
      // console.log('Params:', params);
      let authCode = params['code'];

      console.log('ngOnInit authCode:', authCode);
      if (authCode) {
        this.userService.registerAuthenticationCode(authCode);

        console.log('clearing params, router.navigating to', this.route);
        const queryParams = {};
        this.router.navigate([], { queryParams, replaceUrl: true, relativeTo: this.route });
      }
    });
  }
}
