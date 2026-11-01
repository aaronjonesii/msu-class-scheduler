import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { NavigationEnd, NavigationError, Router } from '@angular/router';
import { finalize, first, forkJoin, take, timer } from 'rxjs';
import { AuthService } from './auth.service';
import { LoggerService } from './logger.service';
import { SSRSafeService } from './ssr-safe.service';

const SPLASH_ID = 'app-splash';
const HIDDEN_CLASS = 'app-splash-hidden';
export const SPLASH_MINIMUM_MS = 600;

/** Controls the splash screen in index.html, which shows before any JavaScript runs. */
@Injectable({ providedIn: 'root' })
export class SplashScreenService {
  private authService = inject(AuthService);
  private document = inject(DOCUMENT);
  private logger = inject(LoggerService);
  private router = inject(Router);
  private ssrSafe = inject(SSRSafeService);

  /**
   * Links wait on the sign-in check before they can navigate, so the app isn't
   * ready to use until that has finished as well as the first page.
   */
  hideWhenAppIsReady(): void {
    // Prerendered pages keep the splash, so they open with it in the browser.
    if (!this.ssrSafe.isBrowser) return;

    const firstPageReady$ = this.router.events.pipe(
      first((event) => event instanceof NavigationEnd || event instanceof NavigationError),
    );
    const signInStateKnown$ = this.authService.authState$().pipe(take(1));
    // Measured from page open, so only a fast load waits, and it doesn't flash.
    const minimumTimePassed$ = timer(Math.max(0, SPLASH_MINIMUM_MS - performance.now()));

    forkJoin([firstPageReady$, signInStateKnown$, minimumTimePassed$]).pipe(
      finalize(() => this.hide()),
    ).subscribe({
      error: (error: unknown) => this.logger.error('Error waiting for the app to start', error),
    });
  }

  private hide(): void {
    const splash = this.document.getElementById(SPLASH_ID);

    splash?.classList.add(HIDDEN_CLASS);
    splash?.addEventListener('transitionend', () => splash.remove(), { once: true });
  }
}
