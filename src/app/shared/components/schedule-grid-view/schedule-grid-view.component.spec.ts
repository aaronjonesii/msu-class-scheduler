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

  it('should show evening classes by default, which run as late as 9:50 PM', () => {
    expect(component.endTime()).toBe('22:00');
  });

  it('should offer to hide the grid options once they are showing', () => {
    component.showGridOptions.set(true);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.grid-options-btn')?.textContent?.trim())
      .toBe('Hide grid options');
  });
});
