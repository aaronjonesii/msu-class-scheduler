import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleClassMeetingsFormComponent } from './schedule-class-meetings-form.component';

describe('ScheduleClassMeetingsFormComponent', () => {
  let component: ScheduleClassMeetingsFormComponent;
  let fixture: ComponentFixture<ScheduleClassMeetingsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleClassMeetingsFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduleClassMeetingsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
