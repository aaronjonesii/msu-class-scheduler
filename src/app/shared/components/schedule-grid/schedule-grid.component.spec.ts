import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GridTile, ScheduleGridComponent } from './schedule-grid.component';
import { CourseMeetingType } from '../../enums/course-meeting-type';
import { Day } from '../../enums/day';
import { ScheduleCourseMeetingType } from '../../enums/schedule-course-meeting-type';
import { ScheduleCourseStatus } from '../../enums/schedule-course-status';
import { ReadScheduleCourse } from '../../interfaces/schedule-course';

const WEEKDAYS = [Day.MONDAY, Day.TUESDAY, Day.WEDNESDAY, Day.THURSDAY, Day.FRIDAY];

function course(id: string, meetings: ReadScheduleCourse['meetings']): ReadScheduleCourse {
  return {
    id, name: id, meetings, status: ScheduleCourseStatus.OPEN, isNotMSUCourse: null,
  } as ReadScheduleCourse;
}

function timed(id: string, startTime: string, endTime: string, days = [Day.MONDAY]): ReadScheduleCourse {
  return course(id, [{
    type: ScheduleCourseMeetingType.LECTURE,
    location: 'Wells Hall A1',
    instructor: null,
    meetingTimes: [{ days, startTime, endTime }],
  }]);
}

function online(id: string, location: string | null = 'Online Asynchronous'): ReadScheduleCourse {
  return course(id, [{
    type: CourseMeetingType.LECTURE as unknown as ScheduleCourseMeetingType,
    location,
    instructor: null,
    meetingTimes: [],
  }]);
}

describe('ScheduleGridComponent', () => {
  let component: ScheduleGridComponent;
  let fixture: ComponentFixture<ScheduleGridComponent>;

  function render(scheduleCourses: ReadScheduleCourse[] = [], inputs: Record<string, unknown> = {}) {
    fixture = TestBed.createComponent(ScheduleGridComponent);
    component = fixture.componentInstance;

    // Tile text wraps by width, so these tests can't depend on the size of the browser window.
    (fixture.nativeElement as HTMLElement).style.width = '800px';

    fixture.componentRef.setInput('days', WEEKDAYS);
    fixture.componentRef.setInput('times', { start: '08:00', end: '22:00' });
    fixture.componentRef.setInput('scheduleCourses', scheduleCourses);
    fixture.componentRef.setInput('shownCourses', scheduleCourses.map((c) => c.id));
    Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
    fixture.detectChanges();
  }

  const tilesOf = (id: string) => component.courseTiles().filter((t) => t.scheduleCourse?.id === id);
  const tileOf = (id: string) => tilesOf(id)[0];
  const rowsOverlap = (a: GridTile, b: GridTile) =>
    a.styles.gridRowStart < b.styles.gridRowEnd && b.styles.gridRowStart < a.styles.gridRowEnd;
  const tileElements = () => Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll('.tile.course'),
  );

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleGridComponent],
    }).compileComponents();
  });

  it('should create', () => {
    render();

    expect(component).toBeTruthy();
  });

  describe('placing classes by their real times', () => {
    it('should not overlap classes with a gap between them', () => {
      render([timed('first', '09:10', '10:00'), timed('second', '10:20', '11:10')]);

      expect(rowsOverlap(tileOf('first'), tileOf('second'))).toBeFalse();
    });

    it('should not overlap a class that ends exactly when the next one starts', () => {
      render([timed('first', '10:00', '11:00'), timed('second', '11:00', '12:00')]);

      expect(rowsOverlap(tileOf('first'), tileOf('second'))).toBeFalse();
    });

    it('should still overlap classes that really do conflict', () => {
      render([timed('first', '09:00', '09:50'), timed('second', '09:30', '10:20')]);

      expect(rowsOverlap(tileOf('first'), tileOf('second'))).toBeTrue();
    });

    it('should show a class starting at 10:20 lower than one starting at 10:00', () => {
      render([timed('on-the-hour', '10:00', '10:50'), timed('later', '10:20', '11:10', [Day.TUESDAY])]);

      expect(tileOf('later').styles.gridRowStart).toBeGreaterThan(tileOf('on-the-hour').styles.gridRowStart);
    });

    it('should make a longer class taller, in proportion to its length', () => {
      render([timed('short', '09:00', '09:50'), timed('long', '13:00', '14:40')]);

      const height = (tile: GridTile) => tile.styles.gridRowEnd - tile.styles.gridRowStart;

      expect(height(tileOf('long'))).toBe(height(tileOf('short')) * 2);
    });

    it('should line a class up with the hour labels', () => {
      render([timed('nine', '09:00', '10:00')]);

      const nineAm = component.timeTiles()[1];

      expect(tileOf('nine').styles.gridRowStart).toBe(nineAm.styles.gridRowStart);
      expect(tileOf('nine').styles.gridRowEnd).toBe(nineAm.styles.gridRowEnd);
    });

    it('should keep each hour label the same height', () => {
      render();

      const heights = component.timeTiles().map((t) => t.styles.gridRowEnd - t.styles.gridRowStart);

      expect(new Set(heights).size).toBe(1);
    });

    it('should start the first hour label directly under the day labels', () => {
      render();

      expect(component.timeTiles()[0].styles.gridRowStart).toBe(2);
    });

    it('should keep a class that starts before the grid inside it', () => {
      render([timed('early', '07:00', '07:50')]);

      expect(tileOf('early').styles.gridRowStart).toBe(2);
      expect(tileOf('early').styles.gridRowEnd).toBeGreaterThan(2);
    });

    it('should produce a valid row count when the end time is not on the hour', () => {
      render([], { times: { start: '08:00', end: '21:50' } });

      expect(component.gridTemplateRows).toContain('repeat(166,');
    });

    it('should keep hours one fixed height, so tile text cannot stretch the grid', () => {
      render([], { rowHeight: 120 });

      expect(component.gridTemplateRows).toContain('repeat(168, 10px)');
    });

    it('should default to a height that fits a week on about one screen', () => {
      render();

      expect(component.rowHeight()).toBe(72);
      expect(component.firstRowHeight()).toBe(40);
    });

    it('should show each hour label without a color of its own', () => {
      render();

      const label = (fixture.nativeElement as HTMLElement).querySelector('.tile.time') as HTMLElement;

      expect(label.className.split(' ').some((name) => name.endsWith('-card'))).toBeFalse();
    });
  });

  describe('reading a class at a glance', () => {
    const textOrder = (tile: Element) => Array.from(tile.querySelectorAll(':scope > span'))
      .map((span) => span.className.split(' ')[0]);

    /** Text that doesn't fit wraps into a column past the edge of the tile. */
    function isInsideTile(element: Element) {
      const { left, right, top, bottom } = element.getBoundingClientRect();
      const tile = (element.closest('.tile') as Element).getBoundingClientRect();

      return left >= tile.left && right <= tile.right && top >= tile.top && bottom <= tile.bottom;
    }

    const ece302 = { ...timed('Electronic Circuits', '09:10', '10:00'), subjectCode: 'ECE', courseNumber: '302' };

    it('should lead with what the class is, then when and where', () => {
      render([ece302]);

      expect(textOrder(tileElements()[0]).slice(0, 3)).toEqual(['course-title', 'times', 'location']);
    });

    it('should show the code and name together on a 50 minute class', () => {
      render([ece302]);

      const title = tileElements()[0].querySelector('.course-title') as Element;

      expect(title.textContent?.replace(/\s+/g, ' ').trim()).toBe('ECE 302 Electronic Circuits');
      expect(isInsideTile(title)).toBeTrue();
    });

    it('should show the time on a 50 minute class with a long name', () => {
      render([{ ...ece302, name: 'Microprocessors & Digital Systems For Engineers And Scientists' }]);

      expect(isInsideTile(tileElements()[0].querySelector('.times') as Element)).toBeTrue();
    });

    it('should show the time on a 45 minute class with a long name', () => {
      render([timed('Microprocessors & Digital Systems For Engineers And Scientists', '09:10', '09:55')]);

      expect(isInsideTile(tileElements()[0].querySelector('.times') as Element)).toBeTrue();
    });

    it('should show the course on a 45 minute class with a long name', () => {
      render([timed('Microprocessors & Digital Systems For Engineers And Scientists', '09:10', '09:55')]);

      expect(isInsideTile(tileElements()[0].querySelector('.course-title') as Element)).toBeTrue();
    });

    it('should keep a class with no set time tall enough to read', () => {
      render([online('iah')]);

      expect(isInsideTile(tileElements()[0].querySelector('.course-title') as Element)).toBeTrue();
    });

    describe('on the waitlist', () => {
      const waitlisted = { ...ece302, status: ScheduleCourseStatus.WAITlIST };

      it('should say so ahead of the course, not on top of it', () => {
        render([waitlisted]);

        const title = tileElements()[0].querySelector('.course-title') as Element;

        expect(title.textContent?.replace(/\s+/g, ' ').trim()).toBe('Waitlist ECE 302 Electronic Circuits');
      });

      it('should keep the time on a 50 minute class in the narrowest column', () => {
        render([{ ...waitlisted, name: 'Microprocessors & Digital Systems For Engineers' }]);
        (fixture.nativeElement as HTMLElement).style.width = '672px';

        expect(isInsideTile(tileElements()[0].querySelector('.times') as Element)).toBeTrue();
      });

      it('should say nothing about it on any other class', () => {
        render([ece302]);

        expect(tileElements()[0].textContent).not.toContain('Waitlist');
      });
    });

    it('should wrap a long name onto a second line instead of cutting it off', () => {
      render([{ ...ece302, name: 'Great Ages Of The Modern World And Beyond' }]);

      const [name, title, time] = ['.name', '.course-title', '.times']
        .map((selector) => tileElements()[0].querySelector(selector) as Element);
      const lineTops = Array.from(name.getClientRects()).map((line) => line.top);

      expect(new Set(lineTops).size).toBeGreaterThan(1);
      // Hidden lines still count in the name's rects, so measure what is left showing too.
      expect(title.getBoundingClientRect().height).toBeGreaterThan(time.getBoundingClientRect().height);
    });

    it('should show the name of a class with no course code', () => {
      render([timed('Study Group', '09:10', '10:00')]);

      const title = tileElements()[0].querySelector('.course-title') as Element;

      expect(title.textContent?.trim()).toBe('Study Group');
      expect(isInsideTile(title)).toBeTrue();
    });

    it('should show the time the same way as the rest of the app', () => {
      render([ece302]);

      expect(tileElements()[0].querySelector('.times')?.textContent).toBe('9:10 AM - 10:00 AM');
    });

    it('should show the hour labels the same way as the classes beside them', () => {
      render();

      const labels = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.tile.time'))
        .map((label) => label.textContent?.trim());

      expect(labels.slice(0, 2)).toEqual(['8:00 AM', '9:00 AM']);
      expect(labels[5]).toBe('1:00 PM');
    });

    it('should show the same tooltip anywhere on the tile', () => {
      render([ece302]);

      expect(tileElements()[0].querySelectorAll('[title]').length).toBe(0);
    });

    it('should keep the details a short tile has no room for in its tooltip', () => {
      const math = course('Calculus II', [{
        type: ScheduleCourseMeetingType.LECTURE,
        location: 'Wells Hall A1',
        instructor: 'Ann Lee',
        meetingTimes: [{ days: [Day.MONDAY], startTime: '09:00', endTime: '09:50' }],
      }]);
      render([math]);

      expect(tileElements()[0].getAttribute('title')).toBe('Calculus II, 9:00 AM - 9:50 AM, Wells Hall A1, Lecture, Ann Lee');
    });

    it('should leave a missing instructor out of the tooltip', () => {
      render([timed('Calculus II', '09:00', '09:50')]);

      expect(tileElements()[0].getAttribute('title')).toBe('Calculus II, 9:00 AM - 9:50 AM, Wells Hall A1, Lecture');
    });

    it('should show an online location once in the tooltip', () => {
      render([online('IAH 221C')]);

      expect(tileElements()[0].getAttribute('title')).toBe('IAH 221C, Online Asynchronous, Lecture');
    });

    it('should add the course description to the tooltip on its own lines', () => {
      render([{ ...timed('Calculus II', '09:00', '09:50'), description: 'Limits and series.' }]);

      expect(tileElements()[0].getAttribute('title'))
        .toBe('Calculus II, 9:00 AM - 9:50 AM, Wells Hall A1, Lecture\n\nLimits and series.');
    });

    it('should mark a class with no set time so it can sit on one line', () => {
      render([online('iah'), timed('math', '09:00', '09:50')]);

      const noTime = tileElements().filter((tile) => tile.classList.contains('no-time'));

      expect(noTime.length).toBe(1);
      expect(noTime[0].textContent).toContain('Online Asynchronous');
    });
  });

  describe('classes with no meeting time', () => {
    it('should draw an online class once, not once per day', () => {
      render([online('iah')]);

      expect(tilesOf('iah').length).toBe(1);
    });

    it('should span the whole week', () => {
      render([online('iah')]);

      expect(tileOf('iah').styles.gridColumnStart).toBe(2);
      expect(tileOf('iah').styles.gridColumnEnd).toBe(WEEKDAYS.length + 2);
    });

    it('should sit below every row of the day', () => {
      render([online('iah')]);

      const lastHour = component.timeTiles()[component.timeTiles().length - 1];

      expect(tileOf('iah').styles.gridRowStart).toBeGreaterThanOrEqual(lastHour.styles.gridRowEnd);
    });

    it('should sit below an evening class that runs past the end of the grid', () => {
      render(
        [timed('evening', '19:00', '21:50'), online('iah')],
        { times: { start: '08:00', end: '19:00' } },
      );

      expect(rowsOverlap(tileOf('evening'), tileOf('iah'))).toBeFalse();
      expect(tileOf('iah').styles.gridRowStart).toBeGreaterThanOrEqual(tileOf('evening').styles.gridRowEnd);
    });

    it('should give each one its own row', () => {
      render([online('first'), online('second')]);

      expect(rowsOverlap(tileOf('first'), tileOf('second'))).toBeFalse();
    });

    it('should show where an online class meets instead of a time', () => {
      render([online('iah')]);

      expect(tileOf('iah').times).toBe('Online Asynchronous');
    });

    it('should not repeat the location under it', () => {
      render([online('iah')]);

      const [tile] = tileElements();

      expect(tile.querySelector('.times')?.textContent).toBe('Online Asynchronous');
      expect(tile.querySelector('.location')).toBeNull();
    });

    it('should still say to be announced when there is no time or online location', () => {
      render([online('unknown', null)]);

      expect(tileOf('unknown').times).toBe('To be announced');
    });

    it('should leave the location on a timed class', () => {
      render([timed('math', '09:00', '09:50')]);

      expect(tileElements()[0].querySelector('.location')?.textContent).toBe('Wells Hall A1');
    });
  });
});
