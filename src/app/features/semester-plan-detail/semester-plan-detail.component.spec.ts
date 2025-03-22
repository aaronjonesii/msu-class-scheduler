import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SemesterPlanDetailComponent } from './semester-plan-detail.component';

describe('SemesterPlanDetailComponent', () => {
  let component: SemesterPlanDetailComponent;
  let fixture: ComponentFixture<SemesterPlanDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SemesterPlanDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SemesterPlanDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
