import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleGridComponent } from './schedule-grid.component';

describe('ScheduleGridComponent', () => {
  let component: ScheduleGridComponent;
  let fixture: ComponentFixture<ScheduleGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduleGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
