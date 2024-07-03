import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class SSRSafeService {
  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  get isBrowser() {
    return isPlatformBrowser(this.platformId);
  }

  get hasWindow() {
    return typeof window !== 'undefined';
  }
}
