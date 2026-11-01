import { CourseMeetingType } from '../enums/course-meeting-type';
import { Day } from '../enums/day';
import { CourseMeeting } from '../interfaces/course-meeting';
import { CourseSection } from '../interfaces/course-section';
import { parseMsuClassPage } from './parse-msu-class-page';
import { ECE_203_PAGE, ECE_331_PAGE } from './parse-msu-class-page.fixtures';
import { ownMeetings, sharedMeetings } from './shared-meetings';

const LECTURE: CourseMeeting = {
  type: CourseMeetingType.LECTURE,
  location: 'Wonders Hall C213',
  instructor: 'Matthew Meier',
  meetingTimes: [{ days: [Day.MONDAY, Day.WEDNESDAY], startTime: '13:50', endTime: '14:40' }],
};
const LAB: CourseMeeting = {
  type: CourseMeetingType.LABORATORY,
  location: 'Engineering Building 3230',
  instructor: null,
  meetingTimes: [{ days: [Day.TUESDAY], startTime: '11:30', endTime: '14:20' }],
};

const sectionWith = (...meetings: CourseMeeting[]): CourseSection => ({ name: 'section', meetings });

function sectionsOf(pageText: string): CourseSection[] {
  return parseMsuClassPage(pageText).page?.options.map(({ sectionName, meetings }) => ({
    name: sectionName, meetings,
  })) ?? [];
}

describe('sharedMeetings', () => {
  it('should find the lecture all the ECE 331 sections have', () => {
    const shared = sharedMeetings(sectionsOf(ECE_331_PAGE));

    expect(shared.length).toBe(1);
    expect(shared[0].location).toBe('Wonders Hall C213');
  });

  it('should find nothing shared between the ECE 203 labs', () => {
    expect(sharedMeetings(sectionsOf(ECE_203_PAGE))).toEqual([]);
  });

  it('should find nothing to share for a single section', () => {
    expect(sharedMeetings([sectionWith(LECTURE)])).toEqual([]);
  });

  it('should find nothing to share when there are no sections', () => {
    expect(sharedMeetings([])).toEqual([]);
  });

  it('should not share a meeting one section does not have', () => {
    expect(sharedMeetings([sectionWith(LECTURE), sectionWith(LECTURE), sectionWith(LAB)])).toEqual([]);
  });

  [
    ['room', { location: 'Wells Hall A1' }],
    ['instructor', { instructor: 'Ann Lee' }],
    ['type', { type: CourseMeetingType.RECITATION }],
    ['days', { meetingTimes: [{ ...LECTURE.meetingTimes[0], days: [Day.FRIDAY] }] }],
    ['time', { meetingTimes: [{ ...LECTURE.meetingTimes[0], startTime: '12:40' }] }],
  ].forEach(([field, change]) => {
    it(`should not share a meeting with a different ${field}`, () => {
      const different = { ...LECTURE, ...(change as Partial<CourseMeeting>) };

      expect(sharedMeetings([sectionWith(LECTURE), sectionWith(different)])).toEqual([]);
    });
  });

  it('should treat a missing instructor and an empty one as the same', () => {
    expect(sharedMeetings([sectionWith(LAB), sectionWith({ ...LAB, instructor: undefined })])).toEqual([LAB]);
  });
});

describe('ownMeetings', () => {
  it('should leave out what every section has', () => {
    expect(ownMeetings(sectionWith(LAB, LECTURE), [LECTURE])).toEqual([LAB]);
  });

  it('should keep everything when nothing is shared', () => {
    expect(ownMeetings(sectionWith(LAB, LECTURE), [])).toEqual([LAB, LECTURE]);
  });
});
