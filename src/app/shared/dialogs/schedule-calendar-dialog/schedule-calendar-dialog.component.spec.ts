import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ScheduleCalendarDialogComponent, ScheduleCalendarDialogContract } from './schedule-calendar-dialog.component';
import { Day } from '../../enums/day';
import { ScheduleCourseMeetingType } from '../../enums/schedule-course-meeting-type';
import { ScheduleCourseStatus } from '../../enums/schedule-course-status';
import { ReadScheduleCourse } from '../../interfaces/schedule-course';

function course(changes: Partial<ReadScheduleCourse> = {}): ReadScheduleCourse {
  return {
    id: 'course',
    name: 'Electronic Circuits',
    subjectCode: 'ECE',
    courseNumber: '302',
    sectionName: '001',
    status: ScheduleCourseStatus.OPEN,
    isNotMSUCourse: null,
    meetings: [{
      type: ScheduleCourseMeetingType.LECTURE,
      location: 'South Kedzie S105',
      instructor: null,
      meetingTimes: [{ days: [Day.MONDAY, Day.WEDNESDAY], startTime: '13:50', endTime: '14:40' }],
    }],
    ...changes,
  };
}

const ONLINE = course({
  subjectCode: 'IAH',
  courseNumber: '221C',
  meetings: [{ type: ScheduleCourseMeetingType.LECTURE, location: 'Online Asynchronous', instructor: null, meetingTimes: [] }],
});

describe('ScheduleCalendarDialogComponent', () => {
  let fixture: ComponentFixture<ScheduleCalendarDialogComponent>;
  let createObjectURL: jasmine.Spy<typeof URL.createObjectURL>;
  let savedAs: string[];

  const dialog = () => fixture.nativeElement as HTMLElement;
  const buttonWithText = (text: string) => Array.from(dialog().querySelectorAll('button'))
    .find((button) => button.textContent?.trim() === text) as HTMLButtonElement;
  const downloadButton = () => buttonWithText('Download calendar file');
  const text = () => dialog().textContent?.replace(/\s+/g, ' ') ?? '';

  async function render(changes: Partial<ScheduleCalendarDialogContract> = {}) {
    await TestBed.configureTestingModule({
      imports: [ScheduleCalendarDialogComponent],
      providers: [
        provideNoopAnimations(),
        {
          provide: MAT_DIALOG_DATA,
          useValue: { scheduleId: 'schedule', scheduleName: 'Spring plan', courses: signal([course()]), ...changes },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleCalendarDialogComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function typeDates(dates: Record<string, string>) {
    Object.entries(dates).forEach(([name, value]) => {
      const input = dialog().querySelector(`input[name="${name}"]`) as HTMLInputElement;

      input.value = value;
      input.dispatchEvent(new Event('input'));
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const SPRING_2027 = { firstDay: '2027-01-19', lastDay: '2027-05-02', breakStart: '2027-03-06', breakEnd: '2027-03-14' };

  beforeEach(() => {
    createObjectURL = spyOn(URL, 'createObjectURL').and.returnValue('blob:file');
    savedAs = [];
    spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function (this: HTMLAnchorElement) {
      savedAs.push(this.download);
    });
  });

  describe('the dates', () => {
    it('should use date boxes that can be typed in', async () => {
      await render();

      ['firstDay', 'lastDay', 'breakStart', 'breakEnd'].forEach((name) => {
        expect((dialog().querySelector(`input[name="${name}"]`) as HTMLInputElement).type).toBe('date');
      });
    });

    it('should wait for the first and last day before offering the file', async () => {
      await render();

      expect(downloadButton().disabled).toBeTrue();

      await typeDates({ firstDay: '2027-01-19' });

      expect(downloadButton().disabled).toBeTrue();

      await typeDates({ lastDay: '2027-05-02' });

      expect(downloadButton().disabled).toBeFalse();
    });

    it('should not need a break', async () => {
      await render();

      await typeDates({ firstDay: '2027-01-19', lastDay: '2027-05-02' });

      expect(dialog().querySelector('[role="alert"]')).toBeNull();
      expect(downloadButton().disabled).toBeFalse();
    });

    it('should stop a last day before the first day', async () => {
      await render();

      await typeDates({ firstDay: '2027-05-02', lastDay: '2027-01-19' });

      expect(dialog().querySelector('[role="alert"]')?.textContent).toContain('The last day must be on or after the first day');
      expect(downloadButton().disabled).toBeTrue();
    });

    it('should stop a break that ends before it starts', async () => {
      await render();

      await typeDates({ ...SPRING_2027, breakStart: '2027-03-14', breakEnd: '2027-03-06' });

      expect(dialog().querySelector('[role="alert"]')?.textContent).toContain('The break must end on or after it starts');
      expect(downloadButton().disabled).toBeTrue();
    });

    it('should stop a break with only one date, which would be ignored', async () => {
      await render();

      await typeDates({ ...SPRING_2027, breakEnd: '' });

      expect(dialog().querySelector('[role="alert"]')?.textContent).toContain('Fill in both break dates, or neither');
      expect(downloadButton().disabled).toBeTrue();
    });

    it('should recover once the dates are fixed', async () => {
      await render();

      await typeDates({ firstDay: '2027-05-02', lastDay: '2027-01-19' });
      await typeDates({ firstDay: '2027-01-19', lastDay: '2027-05-02' });

      expect(dialog().querySelector('[role="alert"]')).toBeNull();
      expect(downloadButton().disabled).toBeFalse();
    });

    it('should warn that one range is used for every class', async () => {
      await render();

      expect(text()).toContain('whole term');
    });

    it('should stop a year that is not four digits, which would put classes centuries away', async () => {
      await render();

      await typeDates({ firstDay: '0027-01-19', lastDay: '2027-05-02' });

      expect(dialog().querySelector('[role="alert"]')?.textContent).toContain('Check the year');
      expect(downloadButton().disabled).toBeTrue();

      await typeDates({ firstDay: '2027-01-19', lastDay: '20277-05-02' });

      expect(dialog().querySelector('[role="alert"]')?.textContent).toContain('Check the year');
      expect(downloadButton().disabled).toBeTrue();
    });
  });

  describe('what is left out', () => {
    it('should name a class with no set time, so it is not a surprise', async () => {
      await render({ courses: signal([course(), ONLINE]) });

      await typeDates(SPRING_2027);

      expect(text()).toContain('IAH 221C Lecture: it has no set time');
      expect(downloadButton().disabled).toBeFalse();
    });

    it('should explain why there is no file when nothing can go in it', async () => {
      await render({ courses: signal([ONLINE]) });

      await typeDates(SPRING_2027);

      expect(text()).toContain('IAH 221C Lecture: it has no set time');
      expect(downloadButton().disabled).toBeTrue();
    });

    it('should show nothing when every class fits', async () => {
      await render();

      await typeDates(SPRING_2027);

      expect(dialog().querySelector('.left-out')).toBeNull();
    });

    it('should read the list out when it appears, so it is not missed', async () => {
      await render({ courses: signal([course(), ONLINE]) });

      const region = dialog().querySelector('[aria-live="polite"]');

      await typeDates(SPRING_2027);

      expect(region).not.toBeNull();
      expect(dialog().querySelector('[aria-live="polite"]')).toBe(region);
      expect(region?.textContent).toContain('IAH 221C Lecture: it has no set time');
    });

    it('should follow changes made to the schedule while it is open', async () => {
      const courses = signal([course()]);
      await render({ courses });

      await typeDates(SPRING_2027);

      courses.set([course(), ONLINE]);
      fixture.detectChanges();

      expect(text()).toContain('IAH 221C Lecture: it has no set time');
    });
  });

  describe('the download', () => {
    async function download() {
      downloadButton().click();

      return await (createObjectURL.calls.mostRecent().args[0] as Blob).text();
    }

    it('should save the classes with the dates as typed, not a day off', async () => {
      await render();

      await typeDates(SPRING_2027);

      const ics = await download();

      expect(ics).toContain('SUMMARY:ECE 302 001 Electronic Circuits');
      expect(ics).toContain('DTSTART;TZID=America/Detroit:20270120T135000');
      expect(ics).toContain('RRULE:FREQ=WEEKLY;UNTIL=20270306T045959Z;BYDAY=MO,WE');
      expect(ics).toContain('RRULE:FREQ=WEEKLY;UNTIL=20270503T035959Z;BYDAY=MO,WE');
    });

    it('should mark the file as a calendar', async () => {
      await render();

      await typeDates(SPRING_2027);

      downloadButton().click();

      expect((createObjectURL.calls.mostRecent().args[0] as Blob).type).toBe('text/calendar;charset=utf-8');
    });

    it('should name the file after the schedule', async () => {
      await render();

      await typeDates(SPRING_2027);

      downloadButton().click();

      expect(savedAs).toEqual(['Spring plan.ics']);
    });

    it('should drop characters a file name can not have', async () => {
      await render({ scheduleName: 'Spring/Fall: "A"?' });

      await typeDates(SPRING_2027);

      downloadButton().click();

      expect(savedAs).toEqual(['SpringFall A.ics']);
    });

    it('should still have a file name for a schedule with no name', async () => {
      await render({ scheduleName: '' });

      await typeDates(SPRING_2027);

      downloadButton().click();

      expect(savedAs).toEqual(['schedule.ics']);
    });
  });

  describe('getting it into a calendar', () => {
    it('should say how for each calendar', async () => {
      await render();

      expect(text()).toContain('Google Calendar');
      expect(text()).toContain('Apple Calendar');
      expect(text()).toContain('Outlook');
    });

    it('should steer towards a new calendar, because importing twice can make duplicates', async () => {
      await render();

      expect(text()).toContain('new calendar');
      expect(text()).toContain('duplicates');
    });

    it('should say Google only imports on a computer', async () => {
      await render();

      expect(text()).toContain('on a computer');
    });

    it('should say final exams are not included', async () => {
      await render();

      expect(text()).toContain('Final exams');
    });
  });
});
