import { CourseMeetingType } from "../enums/course-meeting-type";
import { CourseStatus } from "../enums/course-status";
import { Day } from "../enums/day";
import { SemesterTerm } from "../enums/semester-term";
import { CourseMeeting } from "../interfaces/course-meeting";
import { CourseMeetingTime } from "../interfaces/course-meeting-time";

/** One row of the "Class Selection" table on MSU's class page. */
export interface MsuClassOption {
  optionNumber: number,
  status: CourseStatus | null,
  inCart: boolean,
  sectionName: string,
  meetings: CourseMeeting[],
  seats: string[],
  warnings: string[],
  /** The row could not be read with confidence, so it needs checking by hand. */
  needsReview: boolean,
}

export interface MsuClassPage {
  courseCode: string,
  subjectCode: string,
  courseNumber: string,
  name: string,
  description: string | null,
  credits: number,
  term: SemesterTerm | null,
  year: number | null,
  options: MsuClassOption[],
  warnings: string[],
}

export type MsuClassPageResult =
  { page: MsuClassPage, error: null } | { page: null, error: string };

interface ClassPart {
  type: string | null,
  sectionId: string | null,
}

interface RowColumns {
  parts: ClassPart[],
  /** One entry per line of the column; null when no time is set, like an online section. */
  times: (CourseMeetingTime | null)[],
  /** Rooms, then instructors, then seats. */
  details: string[],
}

const COURSE_CODE = /^([A-Z]{2,5}) (\d{3}[A-Z]?)$/;
const TERM = /^(Spring|Summer|Fall) (\d{4})$/;
const UNITS = /^Units([\d.]+)$/;
const OPTION_COUNT = /^(\d+) options?$/;
const PART_PREFIX = 'Class Comp';
// PeopleSoft cuts this text at 40 characters, so either half can be missing.
const PART_MAX_LENGTH = 40;
const PART_TYPE = /^Class Comp (.+?) - Class/;
const PART_SECTION = /- Class Sect (\S+)( -)?/;
const DATE_RANGE = /^\d{2}\/\d{2}\/\d{4} - \d{2}\/\d{2}\/\d{4}$/;
const TIME_RANGE = /^(\d{1,2}):(\d{2})([AP])M to (\d{1,2}):(\d{2})([AP])M$/;
const OPTION_NUMBER = /^\d+$/;
// MSU writes this as "To be Announced" for instructors and "To be announced" for times.
const NOT_ANNOUNCED = /^to be announced$/i;
const IN_CART = ' / Shopping Cart';
const NOT_A_DESCRIPTION = 'See the Archived Descriptions of Courses';

const DAYS: string[] = Object.values(Day);
const STATUSES: Record<string, CourseStatus> = {
  'Open': CourseStatus.OPEN,
  'Closed': CourseStatus.CLOSED,
  'Wait List': CourseStatus.WAITlIST,
};

const isPart = (line?: string) => line?.startsWith(PART_PREFIX) ?? false;

function firstMatch(lines: string[], pattern: RegExp): RegExpMatchArray | null {
  return lines.map((line) => line.match(pattern)).find((match) => match !== null) ?? null;
}

function to24Hour(hour: string, minute: string, meridiem: string): string {
  const hours = (Number(hour) % 12) + (meridiem === 'P' ? 12 : 0);

  return `${hours.toString().padStart(2, '0')}:${minute}`;
}

/** Reads a days line and the time line below it, e.g. "Thursday", "8:00AM to 10:50AM". */
function parseMeetingTime(daysLine = '', timeLine = ''): CourseMeetingTime | null {
  const days = daysLine.split(' ');
  const time = timeLine.match(TIME_RANGE);

  if (!time || !days.every((day) => DAYS.includes(day))) return null;

  return {
    days: days as Day[],
    startTime: to24Hour(time[1], time[2], time[3]),
    endTime: to24Hour(time[4], time[5], time[6]),
  };
}

function parsePart(line: string): ClassPart {
  const section = line.match(PART_SECTION);
  // A full-length line with nothing after the id may have lost part of the id.
  const isCut = line.length === PART_MAX_LENGTH && !section?.[2];

  return {
    type: line.match(PART_TYPE)?.[1] ?? null,
    sectionId: isCut ? null : section?.[1] ?? null,
  };
}

function toMeetingType(part: ClassPart): CourseMeetingType | null {
  return Object.values(CourseMeetingType).find((type) => type === part.type) ?? null;
}

/** Each cell is on its own line, and a cell with several parts lists them in turn. */
function splitIntoColumns(row: string[]): RowColumns {
  let cursor = row.findIndex(isPart);

  const parts: ClassPart[] = [];
  for (; isPart(row[cursor]); cursor++) parts.push(parsePart(row[cursor]));

  while (DATE_RANGE.test(row[cursor] ?? '')) cursor++;

  const times: RowColumns['times'] = [];
  while (cursor < row.length) {
    const time = parseMeetingTime(row[cursor], row[cursor + 1]);

    if (time) {
      times.push(time);
      cursor += 2;
    } else if (times.length < parts.length && NOT_ANNOUNCED.test(row[cursor])) {
      // Once every part has its time, this text is a room or instructor instead.
      times.push(null);
      cursor++;
    } else {
      break;
    }
  }

  return { parts, times, details: row.slice(cursor) };
}

function warningsFor(parts: ClassPart[], linesUp: boolean): string[] {
  const unknownTypes = parts
    .filter((part) => toMeetingType(part) === null)
    .map((part) => `"${part.type ?? 'Unknown'}" is not a meeting type in this app, so it was saved as Lecture.`);

  return linesUp ? unknownTypes :
    [...unknownTypes, 'The times, rooms and instructors did not line up, so check it on MSU\'s page.'];
}

function toOption(row: string[]): MsuClassOption {
  const optionNumber = Number(row[0]);
  const { parts, times, details } = splitIntoColumns(row);
  const partCount = parts.length;
  const linesUp = times.length === partCount && details.length === partCount * 3;
  const announced = (value: string) => linesUp && !NOT_ANNOUNCED.test(value) ? value : null;

  return {
    optionNumber,
    status: STATUSES[row[1].replace(IN_CART, '')] ?? null,
    inCart: row[1].endsWith(IN_CART),
    sectionName: parts.map((part) => part.sectionId ?? `Option ${optionNumber}`).join(' + '),
    meetings: parts.map((part, index) => ({
      type: toMeetingType(part) ?? CourseMeetingType.LECTURE,
      location: announced(details[index]),
      instructor: announced(details[partCount + index]),
      // Extra times stay with the last part rather than being dropped.
      meetingTimes: (index === partCount - 1 ? times.slice(index) : times.slice(index, index + 1))
        .filter((time) => time !== null),
    })),
    seats: linesUp ? details.slice(partCount * 2) : [],
    warnings: warningsFor(parts, linesUp),
    needsReview: !linesUp,
  };
}

/** A row starts with its option number, then its status and session. */
function findOptionRows(lines: string[]): string[][] {
  const starts = lines.flatMap((line, index) => {
    const startsRow = OPTION_NUMBER.test(line) && lines.slice(index + 1, index + 4).some(isPart);

    return startsRow ? [index] : [];
  });

  return starts.map((start, index) => lines.slice(start, starts[index + 1]));
}

function findDescription(lines: string[]): string | null {
  const start = lines.indexOf('Course Information');
  const end = lines.findIndex((line) => UNITS.test(line));

  if (start === -1 || end <= start) return null;

  return lines.slice(start + 1, end).filter((line) => line !== NOT_A_DESCRIPTION).join(' ') || null;
}

/**
 * Reads the text copied from MSU's class page (Ctrl+A, Ctrl+C on the page with
 * the "Class Selection" table).
 */
export function parseMsuClassPage(text: string): MsuClassPageResult {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const courseCodeIndex = lines.findIndex((line) => COURSE_CODE.test(line));

  if (courseCodeIndex === -1) {
    return {
      page: null,
      error: 'This does not look like an MSU class page. Open a class, press Ctrl+A then Ctrl+C, and paste here.',
    };
  }

  const rows = findOptionRows(lines);

  if (rows.length === 0) {
    return {
      page: null,
      error: 'No class options were found. Open the "Class Selection" section on the page and copy it again.',
    };
  }

  const optionCount = firstMatch(lines, OPTION_COUNT);

  if (optionCount && Number(optionCount[1]) !== rows.length) {
    return {
      page: null,
      error: 'The number of options does not match the page. Clear the box and paste one class page.',
    };
  }

  const courseCode = lines[courseCodeIndex];
  const [, subjectCode, courseNumber] = courseCode.match(COURSE_CODE) as RegExpMatchArray;
  const units = firstMatch(lines, UNITS);
  const term = firstMatch(lines, TERM);

  return {
    error: null,
    page: {
      courseCode,
      subjectCode,
      courseNumber,
      name: lines[courseCodeIndex + 1],
      description: findDescription(lines),
      credits: units ? Number(units[1]) : 0,
      term: term ? term[1] as SemesterTerm : null,
      year: term ? Number(term[2]) : null,
      options: rows.map(toOption),
      warnings: units ? [] : ['Credits were not on the page, so they were set to 0.'],
    },
  };
}
