import { Day } from "../enums/day";
import { CourseMeeting } from "../interfaces/course-meeting";

function dayToInitial(day: Day): string {
  switch (day) {
    case Day.MONDAY:
      return 'Mon';
    case Day.TUESDAY:
      return 'Tue';
    case Day.WEDNESDAY:
      return 'Wed';
    case Day.THURSDAY:
      return 'Thu';
    case Day.FRIDAY:
      return 'Fri';
    case Day.SATURDAY:
      return 'Sat';
    case Day.SUNDAY:
      return 'Sun';
    default:
      return '?';
  }
}

export function formatCourseMeetings(meetings: CourseMeeting[]): string {
  const list: string[] = [];

  for (const meeting of meetings) {
    const { type } = meeting;
    const meetingTimes: string[] = [];
    for (const meetingTime of meeting.meetingTimes) {
      const { days, startTime, endTime } = meetingTime;
      const daysInitials = days.map(dayToInitial);
      meetingTimes.push(`${daysInitials.join(' ')}: ${startTime} - ${endTime}`);
    }
    list.push(`${type}: (${meetingTimes.join(', ')})`);
  }

  return list.join('; ');
}
