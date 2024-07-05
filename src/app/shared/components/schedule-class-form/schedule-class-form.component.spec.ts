import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleClassFormComponent } from './schedule-class-form.component';
import { provideAnimations } from "@angular/platform-browser/animations";

describe('ScheduleClassFormComponent', () => {
  let component: ScheduleClassFormComponent;
  let fixture: ComponentFixture<ScheduleClassFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleClassFormComponent],
      providers: [
        provideAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleClassFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
