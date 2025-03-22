import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SemesterPlanCourseFormDialogComponent } from './semester-plan-course-form-dialog.component';

describe('SemesterPlanClassFormDialogComponent', () => {
  let component: SemesterPlanCourseFormDialogComponent;
  let fixture: ComponentFixture<SemesterPlanCourseFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SemesterPlanCourseFormDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SemesterPlanCourseFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
