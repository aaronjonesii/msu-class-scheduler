import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import {
  TopNavBarComponent
} from "./shared/components/top-nav-bar/top-nav-bar.component";
import { ActivatedRoute } from "@angular/router";
import { AuthService } from "./shared/services/auth.service";
import { SplashScreenService } from "./shared/services/splash-screen.service";

describe('AppComponent startup', () => {
  it('should hide the splash screen when the app is ready', () => {
    const splashScreen = jasmine.createSpyObj<SplashScreenService>('SplashScreenService', ['hideWhenAppIsReady']);

    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [{ provide: SplashScreenService, useValue: splashScreen }],
    }).overrideComponent(AppComponent, { set: { imports: [], template: '' } });

    TestBed.createComponent(AppComponent);

    expect(splashScreen.hideWhenAppIsReady).toHaveBeenCalledTimes(1);
  });
});

xdescribe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        TopNavBarComponent,
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {},
        },
        {
          provide: AuthService,
          useValue: {},
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should render header', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('header')).toBeTruthy();
  });

  it('should render csb-top-nav-bar', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const header = compiled.querySelector('header')?.children[0];

    expect(header?.tagName.toLowerCase()).toBe('csb-top-nav-bar');
  });

  it('should render main', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('main')).toBeTruthy();
  });

  it('should render router-outlet', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const routerOutlet = compiled.querySelector('main')?.children[0];

    expect(routerOutlet?.tagName.toLowerCase()).toBe('router-outlet');
  });

  it('should render footer', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('footer')).toBeTruthy();
  });
});
