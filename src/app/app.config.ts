import {ApplicationConfig, importProvidersFrom} from '@angular/core';
import {PreloadAllModules, provideRouter, withPreloading} from '@angular/router';

import {routes} from './app.routes';
import {provideHttpClient, withFetch} from "@angular/common/http";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {MessageService} from "primeng/api";

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom([BrowserAnimationsModule]),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    // provideClientHydration(),
    provideHttpClient(withFetch()),
    {provide: MessageService, useClass: MessageService},
  ]
};
