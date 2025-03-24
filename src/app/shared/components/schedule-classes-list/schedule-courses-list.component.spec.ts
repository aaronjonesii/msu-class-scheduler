import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleCoursesListComponent } from './schedule-courses-list.component';

describe('ScheduleClassesListComponent', () => {
  let component: ScheduleCoursesListComponent;
  let fixture: ComponentFixture<ScheduleCoursesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleCoursesListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduleCoursesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
