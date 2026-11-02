import { CalendarDates, scheduleCalendar } from './schedule-calendar';
import { Day } from '../enums/day';
import { ScheduleCourseMeetingType } from '../enums/schedule-course-meeting-type';
import { ScheduleCourseStatus } from '../enums/schedule-course-status';
import { ReadScheduleCourse } from '../interfaces/schedule-course';
import { ScheduleCourseMeeting } from '../interfaces/schedule-course-meeting';

const NOW = new Date('2026-11-02T15:00:00.123Z');

/** MSU's Spring 2027: daylight saving starts on the last day of the break. */
const SPRING_2027: CalendarDates = {
  firstDay: '2027-01-19',
  lastDay: '2027-05-02',
  breakStart: '2027-03-06',
  breakEnd: '2027-03-14',
};

const NO_BREAK: CalendarDates = { firstDay: '2027-01-19', lastDay: '2027-05-02' };

const { MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY } = Day;

function meeting(days: Day[], startTime = '13:50', endTime = '14:40', changes: Partial<ScheduleCourseMeeting> = {}): ScheduleCourseMeeting {
  return {
    type: ScheduleCourseMeetingType.LECTURE,
    location: 'Wells Hall A1',
    instructor: 'Ann Lee',
    meetingTimes: [{ days, startTime, endTime }],
    ...changes,
  };
}

function course(meetings: ScheduleCourseMeeting[], changes: Partial<ReadScheduleCourse> = {}): ReadScheduleCourse {
  return {
    id: 'course',
    name: 'Electronic Circuits',
    subjectCode: 'ECE',
    courseNumber: '302',
    sectionName: '001',
    status: ScheduleCourseStatus.OPEN,
    isNotMSUCourse: null,
    meetings,
    ...changes,
  };
}

const unfold = (ics: string) => ics.replace(/\r\n[ \t]/g, '');

function fileFor(courses: ReadScheduleCourse[], dates = SPRING_2027) {
  return scheduleCalendar('schedule', courses, dates, NOW).ics as string;
}

function eventsIn(ics: string) {
  return unfold(ics).split('BEGIN:VEVENT\r\n').slice(1).map((event) => event.split('\r\n'));
}

/** The lines that decide when a class happens, one list per event. */
function timesOf(meetings: ScheduleCourseMeeting[], dates = SPRING_2027) {
  return eventsIn(fileFor([course(meetings)], dates))
    .map((event) => event.filter((line) => /^(DTSTART|DTEND|RRULE)/.test(line)));
}

const startsOf = (meetings: ScheduleCourseMeeting[], dates = SPRING_2027) =>
  timesOf(meetings, dates).map(([start]) => start.replace('DTSTART;TZID=America/Detroit:', ''));

const rulesOf = (meetings: ScheduleCourseMeeting[], dates = SPRING_2027) =>
  timesOf(meetings, dates).map(([, , rule]) => rule);

describe('scheduleCalendar', () => {
  describe('when a class happens', () => {
    it('should split a class around the break, keeping its local time on both sides of daylight saving', () => {
      expect(timesOf([meeting([MONDAY, WEDNESDAY])])).toEqual([
        [
          'DTSTART;TZID=America/Detroit:20270120T135000',
          'DTEND;TZID=America/Detroit:20270120T144000',
          'RRULE:FREQ=WEEKLY;UNTIL=20270306T045959Z;BYDAY=MO,WE',
        ],
        [
          'DTSTART;TZID=America/Detroit:20270315T135000',
          'DTEND;TZID=America/Detroit:20270315T144000',
          'RRULE:FREQ=WEEKLY;UNTIL=20270503T035959Z;BYDAY=MO,WE',
        ],
      ]);
    });

    it('should never rely on skipping single dates, which some calendars ignore', () => {
      expect(fileFor([course([meeting([MONDAY, WEDNESDAY])])])).not.toContain('EXDATE');
    });

    it('should not care what order the days are stored in', () => {
      expect(timesOf([meeting([WEDNESDAY, MONDAY])])).toEqual(timesOf([meeting([MONDAY, WEDNESDAY])]));
    });

    it('should not lose the first week of a Monday, Wednesday and Friday class', () => {
      expect(startsOf([meeting([MONDAY, WEDNESDAY, FRIDAY])])).toEqual(['20270120T135000', '20270315T135000']);
    });

    it('should start each class on its first day on or after the first day of classes', () => {
      expect(startsOf([meeting([TUESDAY])], NO_BREAK)).toEqual(['20270119T135000']);
      expect(startsOf([meeting([THURSDAY])], NO_BREAK)).toEqual(['20270121T135000']);
      expect(startsOf([meeting([FRIDAY])], NO_BREAK)).toEqual(['20270122T135000']);
    });

    it('should not put a Monday class on the Monday before classes start', () => {
      const ics = fileFor([course([meeting([MONDAY])])]);

      expect(startsOf([meeting([MONDAY])])).toEqual(['20270125T135000', '20270315T135000']);
      expect(ics).not.toContain('20270118');
      expect(ics).not.toContain('20270119');
    });

    it('should keep a Friday class before the break and drop the one during it', () => {
      expect(startsOf([meeting([FRIDAY], '20:00', '21:50')])).toEqual(['20270122T200000', '20270319T200000']);
      expect(rulesOf([meeting([FRIDAY], '20:00', '21:50')])).toEqual([
        'RRULE:FREQ=WEEKLY;UNTIL=20270306T045959Z;BYDAY=FR',
        'RRULE:FREQ=WEEKLY;UNTIL=20270503T035959Z;BYDAY=FR',
      ]);
    });

    it('should end at the end of the last day in Michigan, so an evening class on it stays', () => {
      expect(rulesOf([meeting([FRIDAY], '20:00', '21:50')], { firstDay: '2027-01-19', lastDay: '2027-04-30' }))
        .toEqual(['RRULE:FREQ=WEEKLY;UNTIL=20270501T035959Z;BYDAY=FR']);
    });

    it('should use the winter offset for a term that ends in standard time', () => {
      expect(rulesOf([meeting([FRIDAY], '20:00', '21:50')], { firstDay: '2026-09-02', lastDay: '2026-12-11' }))
        .toEqual(['RRULE:FREQ=WEEKLY;UNTIL=20261212T045959Z;BYDAY=FR']);
    });

    it('should use the offset of the last day when the term ends the day daylight saving starts', () => {
      expect(rulesOf([meeting([FRIDAY])], { firstDay: '2027-01-19', lastDay: '2027-03-14' }))
        .toEqual(['RRULE:FREQ=WEEKLY;UNTIL=20270315T035959Z;BYDAY=FR']);
    });

    it('should handle every day of the week, including the weekend', () => {
      expect(rulesOf([meeting([SUNDAY, SATURDAY], '09:00', '11:50')])).toEqual([
        'RRULE:FREQ=WEEKLY;UNTIL=20270306T045959Z;BYDAY=SA,SU',
        'RRULE:FREQ=WEEKLY;UNTIL=20270503T035959Z;BYDAY=SA,SU',
      ]);
      expect(startsOf([meeting([SUNDAY, SATURDAY], '09:00', '11:50')])).toEqual(['20270123T090000', '20270320T090000']);
      expect(rulesOf([meeting([MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY])], NO_BREAK))
        .toEqual(['RRULE:FREQ=WEEKLY;UNTIL=20270503T035959Z;BYDAY=MO,TU,WE,TH,FR']);
    });

    it('should work for a single day of classes', () => {
      expect(timesOf([meeting([TUESDAY], '09:10', '10:00')], { firstDay: '2027-01-19', lastDay: '2027-01-19' })).toEqual([[
        'DTSTART;TZID=America/Detroit:20270119T091000',
        'DTEND;TZID=America/Detroit:20270119T100000',
        'RRULE:FREQ=WEEKLY;UNTIL=20270120T045959Z;BYDAY=TU',
      ]]);
    });

    it('should make one event for each time a meeting has', () => {
      const lab = meeting([TUESDAY], '11:30', '14:20', {
        meetingTimes: [
          { days: [TUESDAY], startTime: '11:30', endTime: '14:20' },
          { days: [THURSDAY], startTime: '15:00', endTime: '15:50' },
        ],
      });

      expect(startsOf([lab], NO_BREAK)).toEqual(['20270119T113000', '20270121T150000']);
    });
  });

  describe('a break', () => {
    const tuesdayAndThursday = [meeting([TUESDAY, THURSDAY], '10:20', '11:40')];

    it('should leave one series when it covers the first week', () => {
      expect(timesOf(tuesdayAndThursday, { ...NO_BREAK, breakStart: '2027-01-19', breakEnd: '2027-01-22' })).toEqual([[
        'DTSTART;TZID=America/Detroit:20270126T102000',
        'DTEND;TZID=America/Detroit:20270126T114000',
        'RRULE:FREQ=WEEKLY;UNTIL=20270503T035959Z;BYDAY=TU,TH',
      ]]);
    });

    it('should leave one series when it covers the last class', () => {
      expect(timesOf(tuesdayAndThursday, { ...NO_BREAK, breakStart: '2027-04-26', breakEnd: '2027-05-02' })).toEqual([[
        'DTSTART;TZID=America/Detroit:20270119T102000',
        'DTEND;TZID=America/Detroit:20270119T114000',
        'RRULE:FREQ=WEEKLY;UNTIL=20270426T035959Z;BYDAY=TU,TH',
      ]]);
    });

    it('should not reach past the last day of classes', () => {
      const ics = fileFor([course(tuesdayAndThursday)], { ...NO_BREAK, breakStart: '2027-04-26', breakEnd: '2027-05-07' });

      expect(eventsIn(ics).length).toBe(1);
      expect(ics).toContain('UNTIL=20270426T035959Z');
    });

    it('should change nothing when it falls outside the term', () => {
      expect(timesOf([meeting([MONDAY, WEDNESDAY])], { ...NO_BREAK, breakStart: '2027-05-03', breakEnd: '2027-05-07' }))
        .toEqual(timesOf([meeting([MONDAY, WEDNESDAY])], NO_BREAK));
    });

    it('should ignore a break with only one of its dates', () => {
      expect(timesOf([meeting([MONDAY, WEDNESDAY])], { ...NO_BREAK, breakStart: '2027-03-06' }))
        .toEqual(timesOf([meeting([MONDAY, WEDNESDAY])], NO_BREAK));
    });
  });

  describe('what is left out', () => {
    const leftOut = (courses: ReadScheduleCourse[], dates = SPRING_2027) =>
      scheduleCalendar('schedule', courses, dates, NOW).leftOut;

    it('should name an online class with no set time', () => {
      const online = course([meeting([], '', '', { meetingTimes: [], location: 'Online Asynchronous' })], {
        subjectCode: 'IAH', courseNumber: '221C',
      });

      expect(leftOut([online])).toEqual([{ course: 'IAH 221C', reason: 'it has no set time' }]);
    });

    it('should name a course with no meetings at all', () => {
      expect(leftOut([course([])])).toEqual([{ course: 'ECE 302', reason: 'it has no set time' }]);
    });

    it('should name a course by its name when it has no code', () => {
      const club = course([], { subjectCode: null, courseNumber: null, name: 'Intramural' });

      expect(leftOut([club])[0].course).toBe('Intramural');
    });

    it('should name a class that does not meet in these dates', () => {
      const dates = { firstDay: '2027-01-19', lastDay: '2027-01-19' };

      expect(leftOut([course([meeting([MONDAY])])], dates))
        .toEqual([{ course: 'ECE 302', reason: 'it does not meet between these dates' }]);
    });

    it('should name a class the break covers completely', () => {
      const dates = { ...NO_BREAK, breakStart: '2027-01-19', breakEnd: '2027-05-02' };

      expect(leftOut([course([meeting([MONDAY, WEDNESDAY])])], dates))
        .toEqual([{ course: 'ECE 302', reason: 'it does not meet between these dates' }]);
    });

    it('should not guess at a class that ends before it starts or crosses midnight', () => {
      const backwards = [meeting([MONDAY], '14:40', '13:50'), meeting([MONDAY], '13:50', '13:50'), meeting([MONDAY], '23:00', '00:50')];
      const calendar = scheduleCalendar('schedule', [course(backwards)], SPRING_2027, NOW);

      expect(calendar.ics).toBeNull();
      expect(calendar.leftOut).toEqual([{ course: 'ECE 302', reason: 'its end time is not after its start time' }]);
    });

    it('should keep the rest of the schedule when part of it is left out', () => {
      const calendar = scheduleCalendar('schedule', [course([meeting([], '', '', { meetingTimes: [] })]), course([meeting([TUESDAY])])], NO_BREAK, NOW);

      expect(eventsIn(calendar.ics as string).length).toBe(1);
      expect(calendar.leftOut.length).toBe(1);
    });

    it('should give no file when there is nothing to put in it', () => {
      expect(scheduleCalendar('schedule', [course([])], SPRING_2027, NOW).ics).toBeNull();
      expect(scheduleCalendar('schedule', [], SPRING_2027, NOW).ics).toBeNull();
    });

    it('should leave nothing out of an ordinary schedule', () => {
      expect(leftOut([course([meeting([MONDAY])])])).toEqual([]);
    });
  });

  describe('what an event says', () => {
    const linesOf = (changes: Partial<ReadScheduleCourse> = {}, meetingChanges: Partial<ScheduleCourseMeeting> = {}) =>
      eventsIn(fileFor([course([meeting([TUESDAY], '13:50', '14:40', meetingChanges)], changes)], NO_BREAK))[0];

    it('should lead with the code and section, then the name', () => {
      expect(linesOf({ sectionName: '002 + LEC1' })).toContain('SUMMARY:ECE 302 002 + LEC1 Electronic Circuits');
    });

    it('should give the room, type and instructor', () => {
      const lines = linesOf();

      expect(lines).toContain('LOCATION:Wells Hall A1');
      expect(lines).toContain('DESCRIPTION:Lecture\\nAnn Lee');
    });

    it('should leave out anything a course does not have, not print null', () => {
      const ics = fileFor([course([meeting([TUESDAY], '13:50', '14:40', { location: null, instructor: null })], {
        subjectCode: null, courseNumber: null, sectionName: null, name: 'Intramural',
      })], NO_BREAK);
      const [lines] = eventsIn(ics);

      expect(lines).toContain('SUMMARY:Intramural');
      expect(lines).toContain('DESCRIPTION:Lecture');
      expect(lines.some((line) => line.startsWith('LOCATION'))).toBeFalse();
      expect(ics).not.toContain('null');
      expect(ics).not.toContain('undefined');
    });

    it('should escape the characters that mean something in a calendar file', () => {
      const lines = linesOf({ name: 'Intro: Data' }, { location: 'Wells Hall, Room 115; Lab', instructor: 'Smith, Jane' });

      expect(lines).toContain('LOCATION:Wells Hall\\, Room 115\\; Lab');
      expect(lines).toContain('DESCRIPTION:Lecture\\nSmith\\, Jane');
      expect(lines).toContain('SUMMARY:ECE 302 001 Intro: Data');
    });

    it('should escape a backslash and a line break in typed text', () => {
      expect(linesOf({}, { location: 'A\\B' })).toContain('LOCATION:A\\\\B');
      expect(linesOf({}, { location: 'Line1\r\nLine2' })).toContain('LOCATION:Line1\\nLine2');
    });

    it('should stamp the export time without milliseconds', () => {
      expect(linesOf()).toContain('DTSTAMP:20261102T150000Z');
    });
  });

  describe('the identity of each event', () => {
    const uids = (ics: string) => eventsIn(ics).flatMap((event) => event.filter((line) => line.startsWith('UID:')));

    it('should give each event its own id, including the two sides of a break', () => {
      const ics = fileFor([course([meeting([MONDAY]), meeting([TUESDAY])]), course([meeting([MONDAY])], { id: 'other' })]);

      expect(new Set(uids(ics)).size).toBe(6);
    });

    it('should stay the same between exports', () => {
      const later = new Date('2026-12-01T00:00:00Z');
      const courses = [course([meeting([MONDAY])])];

      expect(uids(scheduleCalendar('schedule', courses, SPRING_2027, later).ics as string)).toEqual(uids(fileFor(courses)));
    });

    it('should differ between schedules, so two can sit in one calendar', () => {
      const courses = [course([meeting([MONDAY])])];

      expect(uids(scheduleCalendar('other', courses, SPRING_2027, NOW).ics as string)).not.toEqual(uids(fileFor(courses)));
    });

    it('should use only letters, digits and dashes', () => {
      uids(fileFor([course([meeting([MONDAY])])])).forEach((uid) => expect(uid).toMatch(/^UID:[A-Za-z0-9-]{1,254}$/));
    });
  });

  describe('the file itself', () => {
    const ics = () => fileFor([course([meeting([MONDAY])])]);

    it('should start and end cleanly, with nothing before or after', () => {
      expect(ics().startsWith('BEGIN:VCALENDAR\r\n')).toBeTrue();
      expect(ics().endsWith('END:VCALENDAR\r\n')).toBeTrue();
    });

    it('should end every line with CRLF', () => {
      expect(ics().replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
    });

    it('should say what it is', () => {
      expect(ics()).toContain('\r\nVERSION:2.0\r\n');
      expect(ics().match(/\r\nPRODID:/g)?.length).toBe(1);
    });

    it('should define the time zone every class uses', () => {
      const expected = [
        'BEGIN:VTIMEZONE',
        'TZID:America/Detroit',
        'BEGIN:DAYLIGHT',
        'DTSTART:20070311T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
        'TZOFFSETFROM:-0500',
        'TZOFFSETTO:-0400',
        'TZNAME:EDT',
        'END:DAYLIGHT',
        'BEGIN:STANDARD',
        'DTSTART:20071104T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
        'TZOFFSETFROM:-0400',
        'TZOFFSETTO:-0500',
        'TZNAME:EST',
        'END:STANDARD',
        'END:VTIMEZONE',
      ].join('\r\n');

      expect(ics().match(/BEGIN:VTIMEZONE/g)?.length).toBe(1);
      expect(ics()).toContain(expected);
    });

    it('should describe the time zone before the classes that use it', () => {
      expect(ics().indexOf('END:VTIMEZONE')).toBeLessThan(ics().indexOf('BEGIN:VEVENT'));
    });
  });

  describe('long lines', () => {
    const encoder = new TextEncoder();
    const physicalLines = (ics: string) => ics.split('\r\n');
    const summaryLines = (name: string) => {
      const lines = physicalLines(fileFor([course([meeting([TUESDAY])], {
        subjectCode: null, courseNumber: null, sectionName: null, name,
      })], NO_BREAK));
      const start = lines.findIndex((line) => line.startsWith('SUMMARY:'));

      return lines.slice(start, start + 2);
    };

    it('should fold by bytes, not characters', () => {
      const lines = physicalLines(fileFor([course([meeting([TUESDAY])], {
        courseNumber: '331',
        sectionName: '002 + LEC1',
        name: 'Dvořák Seminar: Microprocessors, Interfacing; Peripheral Controllers',
      })], NO_BREAK));
      const start = lines.findIndex((line) => line.startsWith('SUMMARY:'));

      expect(lines[start]).toBe('SUMMARY:ECE 331 002 + LEC1 Dvořák Seminar: Microprocessors\\, Interfacing\\');
      expect(encoder.encode(lines[start]).length).toBe(75);
      expect(lines[start + 1]).toBe(' ; Peripheral Controllers');
    });

    it('should keep every line within 75 bytes', () => {
      const ics = fileFor([course([meeting([TUESDAY])], { name: 'Dvořák '.repeat(40) })], NO_BREAK);

      physicalLines(ics).forEach((line) => expect(encoder.encode(line).length).toBeLessThanOrEqual(75));
    });

    it('should never split a character across lines', () => {
      expect(summaryLines(`${'x'.repeat(66)}ř${'y'.repeat(10)}`)).toEqual([`SUMMARY:${'x'.repeat(66)}`, ` ř${'y'.repeat(10)}`]);
      expect(summaryLines(`${'x'.repeat(66)}😀y`)).toEqual([`SUMMARY:${'x'.repeat(66)}`, ' 😀y']);
    });

    it('should read back as the same text once unfolded', () => {
      const name = `${'Long course name, with; punctuation '.repeat(6)}end`;

      expect(eventsIn(fileFor([course([meeting([TUESDAY])], { subjectCode: null, courseNumber: null, sectionName: null, name })], NO_BREAK))[0])
        .toContain(`SUMMARY:${name.replace(/[;,]/g, '\\$&')}`);
    });
  });
});
