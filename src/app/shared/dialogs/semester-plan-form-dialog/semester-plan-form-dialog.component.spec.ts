import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SemesterPlanFormDialogComponent } from './semester-plan-form-dialog.component';

describe('SemesterPlanFormDialogComponent', () => {
  let component: SemesterPlanFormDialogComponent;
  let fixture: ComponentFixture<SemesterPlanFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SemesterPlanFormDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SemesterPlanFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
