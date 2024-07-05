import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleClassFormComponent } from './schedule-class-form.component';

describe('ScheduleClassFormComponent', () => {
  let component: ScheduleClassFormComponent;
  let fixture: ComponentFixture<ScheduleClassFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleClassFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduleClassFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
