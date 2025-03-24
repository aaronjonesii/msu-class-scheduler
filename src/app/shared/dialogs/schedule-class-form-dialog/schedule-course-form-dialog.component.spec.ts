import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleCourseFormDialogComponent } from './schedule-course-form-dialog.component';
import { provideAnimations } from "@angular/platform-browser/animations";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

describe('ScheduleClassFormDialogComponent', () => {
  let component: ScheduleCourseFormDialogComponent;
  let fixture: ComponentFixture<ScheduleCourseFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleCourseFormDialogComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {},
        },
        provideAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleCourseFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
