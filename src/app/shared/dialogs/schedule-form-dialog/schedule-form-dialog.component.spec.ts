import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleFormDialogComponent } from './schedule-form-dialog.component';
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { provideAnimations } from "@angular/platform-browser/animations";

describe('ScheduleFormDialogComponent', () => {
  let component: ScheduleFormDialogComponent;
  let fixture: ComponentFixture<ScheduleFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleFormDialogComponent],
      providers: [
        provideAnimations(),
        {
          provide: MAT_DIALOG_DATA,
          useValue: {},
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
