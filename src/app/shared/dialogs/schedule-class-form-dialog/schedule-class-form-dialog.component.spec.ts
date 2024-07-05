import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleClassFormDialogComponent } from './schedule-class-form-dialog.component';

describe('ScheduleClassFormDialogComponent', () => {
  let component: ScheduleClassFormDialogComponent;
  let fixture: ComponentFixture<ScheduleClassFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleClassFormDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduleClassFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
