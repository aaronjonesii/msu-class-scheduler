import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleClassMeetingFormComponent } from './schedule-class-meeting-form.component';
import { provideAnimations } from "@angular/platform-browser/animations";

describe('ScheduleClassMeetingFormComponent', () => {
  let component: ScheduleClassMeetingFormComponent;
  let fixture: ComponentFixture<ScheduleClassMeetingFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleClassMeetingFormComponent],
      providers: [provideAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleClassMeetingFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
