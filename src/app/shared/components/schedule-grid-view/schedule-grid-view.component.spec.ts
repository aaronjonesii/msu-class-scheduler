import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleGridViewComponent } from './schedule-grid-view.component';

describe('ScheduleGridViewComponent', () => {
  let component: ScheduleGridViewComponent;
  let fixture: ComponentFixture<ScheduleGridViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleGridViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduleGridViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
