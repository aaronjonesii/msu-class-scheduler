import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ScheduleCoursesListComponent } from './schedule-courses-list.component';
import { Day } from '../../enums/day';
import { ScheduleCourseMeetingType } from '../../enums/schedule-course-meeting-type';
import { ScheduleCourseStatus } from '../../enums/schedule-course-status';
import { ReadScheduleCourse } from '../../interfaces/schedule-course';

describe('ScheduleClassesListComponent', () => {
  let component: ScheduleCoursesListComponent;
  let fixture: ComponentFixture<ScheduleCoursesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleCoursesListComponent],
      providers: [provideNoopAnimations()],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduleCoursesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  async function meetingLine(location: string | null, meetingTimes: ReadScheduleCourse['meetings'][number]['meetingTimes'] = []) {
    fixture.componentRef.setInput('scheduleCourses', [{
      id: 'course',
      name: 'Course',
      status: ScheduleCourseStatus.OPEN,
      isNotMSUCourse: null,
      meetings: [{ type: ScheduleCourseMeetingType.LECTURE, location, instructor: null, meetingTimes }],
    } as ReadScheduleCourse]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    return (fixture.nativeElement as HTMLElement).querySelector('.meeting-time')?.textContent?.replace(/\s+/g, ' ').trim();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show where an online class meets instead of a time', async () => {
    expect(await meetingLine('Online Asynchronous')).toBe('Lecture - Online Asynchronous');
  });

  it('should show a meeting time in 12-hour form', async () => {
    const meetingTimes = [{ days: [Day.MONDAY, Day.WEDNESDAY], startTime: '13:50', endTime: '14:40' }];

    expect(await meetingLine('Wells Hall', meetingTimes)).toBe('Lecture - Monday, Wednesday 1:50 PM - 2:40 PM');
  });

  it('should say to be announced when there is no time or online location', async () => {
    expect(await meetingLine(null)).toBe('Lecture - To be announced');
  });
});
