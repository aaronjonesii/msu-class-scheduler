import { TestBed } from '@angular/core/testing';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { ReplaySubject, Subject } from 'rxjs';

import { AuthService } from './auth.service';
import { LoggerService } from './logger.service';
import { SPLASH_MINIMUM_MS, SplashScreenService } from './splash-screen.service';
import { SSRSafeService } from './ssr-safe.service';

describe('SplashScreenService', () => {
  let routerEvents: Subject<unknown>;
  let authState: ReplaySubject<{ uid: string } | null>;
  let splash: HTMLElement;
  let isBrowser: boolean;
  let msSincePageOpened: jasmine.Spy;

  const HIDDEN_CLASS = 'app-splash-hidden';
  const isHidden = () => splash.classList.contains(HIDDEN_CLASS);
  const start = () => TestBed.inject(SplashScreenService).hideWhenAppIsReady();
  const navigationEnd = () => new NavigationEnd(1, '/', '/');
  const waitOutMinimum = () => jasmine.clock().tick(SPLASH_MINIMUM_MS);

  function appBecomesReady() {
    routerEvents.next(navigationEnd());
    authState.next({ uid: 'user' });
  }

  beforeEach(() => {
    routerEvents = new Subject();
    authState = new ReplaySubject(1);
    isBrowser = true;

    splash = document.createElement('div');
    splash.id = 'app-splash';
    document.body.append(splash);

    jasmine.clock().install();
    msSincePageOpened = spyOn(performance, 'now').and.returnValue(0);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { events: routerEvents } },
        { provide: AuthService, useValue: { authState$: () => authState } },
        { provide: LoggerService, useValue: jasmine.createSpyObj('LoggerService', ['error']) },
        { provide: SSRSafeService, useValue: { get isBrowser() { return isBrowser; } } },
      ],
    });
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    splash.remove();
  });

  it('should stay up while nothing is known yet', () => {
    start();
    waitOutMinimum();

    expect(isHidden()).toBeFalse();
  });

  it('should stay up when the page is ready but the sign-in state is not', () => {
    start();

    routerEvents.next(navigationEnd());
    waitOutMinimum();

    expect(isHidden()).toBeFalse();
  });

  it('should stay up when the sign-in state is known but the page is not ready', () => {
    start();

    authState.next({ uid: 'user' });
    waitOutMinimum();

    expect(isHidden()).toBeFalse();
  });

  it('should ignore a navigation that has only started', () => {
    start();

    authState.next({ uid: 'user' });
    routerEvents.next(new NavigationStart(1, '/'));
    waitOutMinimum();

    expect(isHidden()).toBeFalse();
  });

  // A route guard that redirects cancels the first navigation, then starts another.
  it('should stay up through a redirect', () => {
    start();

    authState.next(null);
    routerEvents.next(new NavigationCancel(1, '/schedules', 'Redirected'));
    waitOutMinimum();

    expect(isHidden()).toBeFalse();
  });

  it('should hide once the page and the sign-in state are both known', () => {
    start();

    appBecomesReady();
    waitOutMinimum();

    expect(isHidden()).toBeTrue();
  });

  it('should hide for a signed out visitor too', () => {
    start();

    authState.next(null);
    routerEvents.next(navigationEnd());
    waitOutMinimum();

    expect(isHidden()).toBeTrue();
  });

  describe('minimum time on screen', () => {
    it('should not flash away when the app is ready straight away', () => {
      start();

      appBecomesReady();
      jasmine.clock().tick(SPLASH_MINIMUM_MS - 1);

      expect(isHidden()).toBeFalse();

      jasmine.clock().tick(1);

      expect(isHidden()).toBeTrue();
    });

    it('should count from when the page opened, not from when the app started', () => {
      msSincePageOpened.and.returnValue(SPLASH_MINIMUM_MS - 100);
      start();

      appBecomesReady();
      jasmine.clock().tick(100);

      expect(isHidden()).toBeTrue();
    });

    it('should not add any wait to a load that was already slow', () => {
      msSincePageOpened.and.returnValue(SPLASH_MINIMUM_MS * 5);
      start();

      appBecomesReady();
      jasmine.clock().tick(0);

      expect(isHidden()).toBeTrue();
    });
  });

  it('should not leave the app locked behind the splash when a page fails to load', () => {
    start();

    authState.next(null);
    routerEvents.next(new NavigationError(1, '/schedules', new Error('chunk failed')));
    waitOutMinimum();

    expect(isHidden()).toBeTrue();
  });

  it('should not leave the app locked behind the splash when the sign-in check fails', () => {
    start();

    authState.error(new Error('auth failed'));

    expect(isHidden()).toBeTrue();
    expect(TestBed.inject(LoggerService).error).toHaveBeenCalled();
  });

  it('should remove the splash after it fades out', () => {
    start();

    appBecomesReady();
    waitOutMinimum();
    splash.dispatchEvent(new Event('transitionend'));

    expect(document.getElementById('app-splash')).toBeNull();
  });

  it('should leave the splash in place when prerendering, so the page opens with it', () => {
    isBrowser = false;
    start();

    appBecomesReady();
    waitOutMinimum();

    expect(isHidden()).toBeFalse();
  });

  it('should cope with the splash already being gone', () => {
    splash.remove();
    start();

    appBecomesReady();

    expect(waitOutMinimum).not.toThrow();
  });
});
