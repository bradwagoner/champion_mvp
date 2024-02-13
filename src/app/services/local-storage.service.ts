import {afterRender, Inject, Injectable, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from "@angular/common";

@Injectable({
    providedIn: 'root'
})
export class LocalStorageService {

    public isBrowser: boolean;

    constructor(@Inject(PLATFORM_ID) public platformId: any) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    getItem<T>(itemKey: string) {
        return this.isBrowser ? localStorage.getItem(itemKey) : null;
    }

    setItem(itemKey: string, item: any) {
        if (this.isBrowser) {
            localStorage.setItem(itemKey, item);
        }
    }

    removeItem(itemKey: string) {
        if (this.isBrowser) {
            localStorage.removeItem(itemKey);
        }
    }
}
