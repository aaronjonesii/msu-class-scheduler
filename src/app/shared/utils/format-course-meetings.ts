import { Day } from "../enums/day";
import { CourseMeeting } from "../interfaces/course-meeting";
import { formatTimeRange } from "./format-time";
import { noMeetingTimeLabel } from "./no-meeting-time-label";

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

export function formatDays(days: Day[]): string {
  return days.map(dayToInitial).join(' ');
}

export function formatCourseMeetings(meetings: CourseMeeting[]): string {
  const list: string[] = [];

  for (const meeting of meetings) {
    const { type } = meeting;
    const meetingTimes: string[] = [];
    for (const meetingTime of meeting.meetingTimes) {
      meetingTimes.push(`${formatDays(meetingTime.days)}: ${formatTimeRange(meetingTime)}`);
    }
    list.push(`${type}: (${meetingTimes.join(', ') || noMeetingTimeLabel(meeting)})`);
  }

  return list.join('; ');
}
