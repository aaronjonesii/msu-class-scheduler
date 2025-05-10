import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleCourseFormComponent } from './schedule-course-form.component';
import { provideAnimations } from "@angular/platform-browser/animations";

describe('ScheduleClassFormComponent', () => {
  let component: ScheduleCourseFormComponent;
  let fixture: ComponentFixture<ScheduleCourseFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleCourseFormComponent],
      providers: [
        provideAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleCourseFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
