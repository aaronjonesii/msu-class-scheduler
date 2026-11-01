import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ScheduleCoursesListComponent } from './schedule-courses-list.component';
import { Color } from '../../enums/color';
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

  describe('the header of a course', () => {
    const card = () => (fixture.nativeElement as HTMLElement).querySelector('mat-card') as HTMLElement;
    const textOf = (selector: string) => card().querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();
    const credits = () => Array.from(card().querySelectorAll('span'))
      .find((span) => /\d credits?$/.test(span.textContent?.trim() ?? '')) as HTMLElement;

    async function render(changes: Partial<ReadScheduleCourse>) {
      fixture.componentRef.setInput('scheduleCourses', [{
        id: 'course-id', name: 'Calculus II', status: ScheduleCourseStatus.OPEN, isNotMSUCourse: null, meetings: [],
        ...changes,
      } as ReadScheduleCourse]);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    }

    it('should show the code as the title and the name under it', async () => {
      await render({ subjectCode: 'MTH', courseNumber: '133' });

      expect(textOf('mat-card-title')).toBe('MTH 133');
      expect(textOf('mat-card-subtitle')).toBe('Calculus II');
    });

    it('should put the name under the code, not beside it', async () => {
      (fixture.nativeElement as HTMLElement).style.width = '311px';

      await render({ subjectCode: 'PHY', courseNumber: '183', name: 'Phys Scientists & Engineers I' });

      const title = (card().querySelector('mat-card-title') as HTMLElement).getBoundingClientRect();
      const subtitle = (card().querySelector('mat-card-subtitle') as HTMLElement).getBoundingClientRect();

      expect(subtitle.top).toBeGreaterThanOrEqual(title.bottom);
    });

    it('should show a course with no code by its name', async () => {
      await render({});

      expect(textOf('mat-card-title')).toBe('Calculus II');
      expect(card().querySelector('mat-card-subtitle')).toBeNull();
    });

    it('should keep the id on the card, because the chips scroll to it', async () => {
      await render({});

      expect(card().id).toBe('course-id');
    });

    it('should color the header and leave the rest of the card plain', async () => {
      await render({ color: Color.AZURE });

      expect(card().querySelector('mat-card-header')?.classList).toContain('azure-card');
      expect(card().classList).not.toContain('azure-card');
    });

    it('should say credit for one', async () => {
      await render({ credits: 1 });

      expect(credits().textContent?.trim()).toBe('1 credit');
    });

    it('should never put the credits on top of a long title', async () => {
      (fixture.nativeElement as HTMLElement).style.width = '311px';

      await render({ subjectCode: 'MTH', courseNumber: '133', credits: 4 });

      const title = (card().querySelector('mat-card-title') as HTMLElement).getBoundingClientRect();

      expect(title.right).toBeLessThanOrEqual(credits().getBoundingClientRect().left);
    });

    it('should keep a long description closed until it is asked for', async () => {
      await render({ description: 'Applications of the integral.' });

      const description = card().querySelector('details') as HTMLDetailsElement;

      expect(description.open).toBeFalse();
      expect(description.querySelector('summary')?.textContent).toContain('Description');
      expect(description.textContent).toContain('Applications of the integral.');
    });

    it('should leave out the description when there is none', async () => {
      await render({ description: null });

      expect(card().querySelector('details')).toBeNull();
    });
  });

  it('should say to be announced when there is no time or online location', async () => {
    expect(await meetingLine(null)).toBe('Lecture - To be announced');
  });
});
