import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SemesterPlanCoursesListComponent } from './semester-plan-courses-list.component';

describe('SemesterPlanCoursesListComponent', () => {
  let component: SemesterPlanCoursesListComponent;
  let fixture: ComponentFixture<SemesterPlanCoursesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SemesterPlanCoursesListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SemesterPlanCoursesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
