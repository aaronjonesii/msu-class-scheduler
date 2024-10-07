import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SemesterPlanFormComponent } from './semester-plan-form.component';

describe('SemesterPlanFormComponent', () => {
  let component: SemesterPlanFormComponent;
  let fixture: ComponentFixture<SemesterPlanFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SemesterPlanFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SemesterPlanFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
