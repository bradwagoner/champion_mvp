import {ApplicationConfig, importProvidersFrom} from '@angular/core';
import {PreloadAllModules, provideRouter, withPreloading} from '@angular/router';

import {routes} from './app.routes';
import {provideHttpClient, withFetch} from "@angular/common/http";
import {CookieService} from "ngx-cookie-service";
import {provideClientHydration} from "@angular/platform-browser";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom([BrowserAnimationsModule]),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    // provideClientHydration(),
    provideHttpClient(withFetch()),
    {provide: CookieService, useClass: CookieService},
  ]
};
