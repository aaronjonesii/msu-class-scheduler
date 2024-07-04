import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchedulesComponent } from './schedules.component';
import { SchedulesService } from "../../shared/services/schedules.service";
import { AuthService } from "../../shared/services/auth.service";
import SpyObj = jasmine.SpyObj;
import createSpyObj = jasmine.createSpyObj;
import { of } from "rxjs";

describe('SchedulesComponent', () => {
  let component: SchedulesComponent;
  let fixture: ComponentFixture<SchedulesComponent>;
  let mockAuthService: SpyObj<AuthService>;
  let mockSchedulesService: SpyObj<SchedulesService>;

  beforeEach(async () => {
    mockAuthService = createSpyObj('AuthService', ['authState$']);
    mockSchedulesService = createSpyObj('SchedulesService', ['getByUser$'])

    mockAuthService.authState$.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [SchedulesComponent],
      providers: [
        {
          provide: SchedulesService,
          useValue: mockSchedulesService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchedulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show empty schedules when user is not authenticated', () => {
    expect(mockSchedulesService.getByUser$).not.toHaveBeenCalled();
    expect(component.schedules()).toEqual([]);
  });
});
