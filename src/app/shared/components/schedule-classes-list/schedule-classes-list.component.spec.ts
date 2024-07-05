import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleClassesListComponent } from './schedule-classes-list.component';

describe('ScheduleClassesListComponent', () => {
  let component: ScheduleClassesListComponent;
  let fixture: ComponentFixture<ScheduleClassesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleClassesListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduleClassesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
