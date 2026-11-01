import { CourseMeetingType } from '../enums/course-meeting-type';
import { Day } from '../enums/day';
import { formatCourseMeetings } from './format-course-meetings';

describe('formatCourseMeetings', () => {
  it('should describe a meeting with its days and times', () => {
    expect(formatCourseMeetings([{
      type: CourseMeetingType.LECTURE,
      meetingTimes: [{ days: [Day.MONDAY, Day.WEDNESDAY], startTime: '09:10', endTime: '10:00' }],
    }])).toBe('Lecture: (Mon Wed: 09:10 - 10:00)');
  });

  it('should separate several meetings', () => {
    expect(formatCourseMeetings([
      {
        type: CourseMeetingType.LABORATORY,
        meetingTimes: [{ days: [Day.TUESDAY], startTime: '11:30', endTime: '14:20' }],
      },
      {
        type: CourseMeetingType.LECTURE,
        meetingTimes: [{ days: [Day.FRIDAY], startTime: '13:50', endTime: '14:40' }],
      },
    ])).toBe('Laboratory: (Tue: 11:30 - 14:20); Lecture: (Fri: 13:50 - 14:40)');
  });

  it('should show where an online section meets instead of a time', () => {
    expect(formatCourseMeetings([{
      type: CourseMeetingType.LECTURE,
      location: 'Online Asynchronous',
      meetingTimes: [],
    }])).toBe('Lecture: (Online Asynchronous)');
  });

  it('should say when a meeting has no time yet', () => {
    expect(formatCourseMeetings([{
      type: CourseMeetingType.LECTURE,
      meetingTimes: [],
    }])).toBe('Lecture: (To be announced)');
  });

  it('should describe nothing when there are no meetings', () => {
    expect(formatCourseMeetings([])).toBe('');
  });
});
