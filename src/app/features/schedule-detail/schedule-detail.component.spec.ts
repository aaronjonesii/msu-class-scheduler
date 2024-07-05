import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleDetailComponent } from './schedule-detail.component';
import { SchedulesService } from "../../shared/services/schedules.service";
import {
  ScheduleClassesService
} from "../../shared/services/schedule-classes.service";

describe('ScheduleDetailComponent', () => {
  let component: ScheduleDetailComponent;
  let fixture: ComponentFixture<ScheduleDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleDetailComponent],
      providers: [
        {
          provide: SchedulesService,
          useValue: {},
        },
        {
          provide: ScheduleClassesService,
          useValue: {},
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
