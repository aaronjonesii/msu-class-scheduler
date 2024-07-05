import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleClassFormDialogComponent } from './schedule-class-form-dialog.component';
import { provideAnimations } from "@angular/platform-browser/animations";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

describe('ScheduleClassFormDialogComponent', () => {
  let component: ScheduleClassFormDialogComponent;
  let fixture: ComponentFixture<ScheduleClassFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleClassFormDialogComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {},
        },
        provideAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleClassFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
