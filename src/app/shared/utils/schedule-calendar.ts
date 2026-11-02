import { Timestamp } from "@angular/fire/firestore";
import { Day } from "../enums/day";
import { ReadScheduleCourse } from "../interfaces/schedule-course";
import { ScheduleCourseMeeting } from "../interfaces/schedule-course-meeting";
import { ScheduleCourseMeetingTime } from "../interfaces/schedule-course-meeting-time";

export interface CalendarDates {
  firstDay: string,
  lastDay: string,
  breakStart?: string | null,
  breakEnd?: string | null,
}

export interface LeftOutClass {
  course: string,
  reason: string,
}

export interface ScheduleCalendar {
  ics: string | null,
  leftOut: LeftOutClass[],
}

interface DaySpan {
  first: number,
  last: number,
}

/** Every class is in Michigan, wherever the file is made or opened. */
const TIME_ZONE = 'America/Detroit';

/** Calendars need this to keep a class at the same local time across daylight saving. */
const TIME_ZONE_DEFINITION = [
  'BEGIN:VTIMEZONE',
  `TZID:${TIME_ZONE}`,
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
];

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const STANDARD_TIME_HOURS_BEHIND_UTC = 5;

/** The longest a line in the file should be, counted in bytes. */
const MAX_LINE_BYTES = 75;

/** In the order Date.getUTCDay() counts them. */
const WEEK = [Day.SUNDAY, Day.MONDAY, Day.TUESDAY, Day.WEDNESDAY, Day.THURSDAY, Day.FRIDAY, Day.SATURDAY];

const NO_SET_TIME = 'it has no set time';
const NOT_IN_DATES = 'it does not meet between these dates';
const ENDS_BEFORE_IT_STARTS = 'its end time is not after its start time';

/** Whole days since 1970. A typed date has no time or zone, so it can't drift a day in any time zone. */
const toDayNumber = (date: string) => Date.parse(`${date}T00:00:00Z`) / MS_PER_DAY;

/** The course form saves the midnight a date picker gives, so read it back as a day in Michigan. */
const michiganDay = (date: Timestamp) =>
  toDayNumber(new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(date.toDate()));

const weekdayOf = (day: number) => WEEK[new Date(day * MS_PER_DAY).getUTCDay()];

const dateStamp = (day: number) => new Date(day * MS_PER_DAY).toISOString().slice(0, 10).replace(/-/g, '');

const timeStamp = (time: string) => `${time.replace(':', '')}00`;

const utcStamp = (instant: Date) => instant.toISOString().replace(/[-:]|\.\d+/g, '');

/** A class repeats after a break by starting over, because some calendars ignore a list of dates to skip. */
function classSpans({ firstDay, lastDay, breakStart, breakEnd }: CalendarDates): DaySpan[] {
  const first = toDayNumber(firstDay);
  const last = toDayNumber(lastDay);

  if (!breakStart || !breakEnd) return [{ first, last }];

  return [
    { first, last: Math.min(last, toDayNumber(breakStart) - 1) },
    { first: Math.max(first, toDayNumber(breakEnd) + 1), last },
  ];
}

/** A class with its own dates keeps to them, like one that only runs the second half of the term. */
function courseSpans(spans: DaySpan[], { startDate, endDate }: ReadScheduleCourse): DaySpan[] {
  const first = startDate ? michiganDay(startDate) : -Infinity;
  const last = endDate ? michiganDay(endDate) : Infinity;

  return spans.map((span) => ({ first: Math.max(span.first, first), last: Math.min(span.last, last) }));
}

function firstClassIn({ first, last }: DaySpan, days: Day[]): number | undefined {
  for (let day = first; day <= last && day < first + WEEK.length; day++) {
    if (days.includes(weekdayOf(day))) return day;
  }

  return undefined;
}

/** The last moment of a day in Michigan, in UTC, whichever offset that day is on. */
function endOfDayInUtc(day: number): string {
  const inStandardTime = new Date((day + 1) * MS_PER_DAY + STANDARD_TIME_HOURS_BEHIND_UTC * MS_PER_HOUR - 1000);
  const hourInMichigan = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, hour: 'numeric', hourCycle: 'h23' })
    .format(inStandardTime);

  return utcStamp(Number(hourInMichigan) === 23 ? inStandardTime : new Date(inStandardTime.getTime() - MS_PER_HOUR));
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/[;,]/g, '\\$&')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/** Counts bytes and walks whole characters, so a line never ends partway through one. */
function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const lines: string[] = [];
  let current = '';
  let bytes = 0;

  for (const character of line) {
    const size = encoder.encode(character).length;

    if (bytes + size > MAX_LINE_BYTES) {
      lines.push(current);
      current = ' ';
      bytes = 1;
    }

    current += character;
    bytes += size;
  }

  return [...lines, current].join('\r\n');
}

const textLine = (name: string, values: unknown[], separator: string) =>
  `${name}:${escapeText(values.filter(Boolean).join(separator))}`;

function courseLabel({ subjectCode, courseNumber, name }: ReadScheduleCourse): string {
  return [subjectCode, courseNumber].filter(Boolean).join(' ') || name;
}

function eventLines(
  uid: string,
  stamp: string,
  { subjectCode, courseNumber, sectionName, name }: ReadScheduleCourse,
  { type, location, instructor }: ScheduleCourseMeeting,
  { days, startTime, endTime }: ScheduleCourseMeetingTime,
  firstClass: number,
  span: DaySpan,
): string[] {
  const dayCodes = Object.values(Day)
    .filter((day) => days.includes(day))
    .map((day) => day.slice(0, 2).toUpperCase());

  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${TIME_ZONE}:${dateStamp(firstClass)}T${timeStamp(startTime)}`,
    `DTEND;TZID=${TIME_ZONE}:${dateStamp(firstClass)}T${timeStamp(endTime)}`,
    `RRULE:FREQ=WEEKLY;UNTIL=${endOfDayInUtc(span.last)};BYDAY=${dayCodes.join(',')}`,
    textLine('SUMMARY', [subjectCode, courseNumber, sectionName, name], ' '),
    ...(location ? [textLine('LOCATION', [location], ' ')] : []),
    textLine('DESCRIPTION', [type, instructor], '\n'),
    'END:VEVENT',
  ];
}

/**
 * Builds an iCalendar file with a weekly repeating event for each class. A file
 * can't say how to fix a class it can't place, so those come back in leftOut.
 */
export function scheduleCalendar(
  scheduleId: string,
  courses: ReadScheduleCourse[],
  dates: CalendarDates,
  now: Date,
): ScheduleCalendar {
  const spans = classSpans(dates);
  const stamp = utcStamp(now);
  const events: string[][] = [];
  const leftOut: LeftOutClass[] = [];

  /** Names the meeting too, because the rest of the course may be in the file. */
  const leaveOut = (course: ReadScheduleCourse, reason: string, meeting?: ScheduleCourseMeeting) => {
    const label = [courseLabel(course), meeting?.type].filter(Boolean).join(' ');

    if (!leftOut.some((left) => left.course === label && left.reason === reason)) {
      leftOut.push({ course: label, reason });
    }
  };

  for (const course of courses) {
    if (course.meetings.length === 0) leaveOut(course, NO_SET_TIME);

    course.meetings.forEach((meeting, meetingIndex) => {
      if (meeting.meetingTimes.length === 0) leaveOut(course, NO_SET_TIME, meeting);

      meeting.meetingTimes.forEach((time, timeIndex) => {
        if (time.endTime <= time.startTime) {
          leaveOut(course, ENDS_BEFORE_IT_STARTS, meeting);

          return;
        }

        const classEvents = courseSpans(spans, course).flatMap((span, spanIndex) => {
          const firstClass = firstClassIn(span, time.days);
          const uid = [scheduleId, course.id, meetingIndex, timeIndex, spanIndex].join('-');

          return firstClass === undefined ? [] : [eventLines(uid, stamp, course, meeting, time, firstClass, span)];
        });

        if (classEvents.length === 0) leaveOut(course, NOT_IN_DATES, meeting);

        events.push(...classEvents);
      });
    });
  }

  if (events.length === 0) return { ics: null, leftOut };

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MSU Class Scheduler//Schedule Export//EN',
    ...TIME_ZONE_DEFINITION,
    ...events.flat(),
    'END:VCALENDAR',
  ];

  return { ics: `${lines.map(foldLine).join('\r\n')}\r\n`, leftOut };
}
