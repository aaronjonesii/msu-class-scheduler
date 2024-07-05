import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleClassMeetingFormComponent } from './schedule-class-meeting-form.component';

describe('ScheduleClassMeetingFormComponent', () => {
  let component: ScheduleClassMeetingFormComponent;
  let fixture: ComponentFixture<ScheduleClassMeetingFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleClassMeetingFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduleClassMeetingFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
