import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SemesterPlanCourseSectionFormDialogComponent } from './semester-plan-course-section-form-dialog.component';

describe('SemesterPlanCourseSectionFormDialogComponent', () => {
  let component: SemesterPlanCourseSectionFormDialogComponent;
  let fixture: ComponentFixture<SemesterPlanCourseSectionFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SemesterPlanCourseSectionFormDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SemesterPlanCourseSectionFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
