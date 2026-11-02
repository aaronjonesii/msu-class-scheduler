import { CourseMeetingType } from '../enums/course-meeting-type';
import { CourseMeeting } from '../interfaces/course-meeting';
import { formatMeetingDetails } from './format-meeting-details';

function meeting(location: string | null, instructor: string | null): CourseMeeting {
  return { type: CourseMeetingType.LECTURE, location, instructor, meetingTimes: [] };
}

describe('formatMeetingDetails', () => {
  it('should list the room then the instructor', () => {
    expect(formatMeetingDetails([meeting('Wells Hall A1', 'Ann Lee')])).toBe('Wells Hall A1 · Ann Lee');
  });

  it('should leave out what is not known', () => {
    expect(formatMeetingDetails([meeting(null, 'Ann Lee')])).toBe('Ann Lee');
    expect(formatMeetingDetails([meeting(null, null)])).toBe('');
  });

  it('should list a repeated room or instructor once', () => {
    const meetings = [meeting('Wells Hall A1', 'Ann Lee'), meeting('Engineering Building 3230', 'Ann Lee')];

    expect(formatMeetingDetails(meetings)).toBe('Wells Hall A1 · Ann Lee · Engineering Building 3230');
  });
});
