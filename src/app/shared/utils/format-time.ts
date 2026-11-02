import { CourseMeetingTime } from "../interfaces/course-meeting-time";

/** Reads a stored time like "13:50" as "1:50 PM". */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = Number(hours);

  return `${hour % 12 || 12}:${minutes} ${hour < 12 ? 'AM' : 'PM'}`;
}

export function formatTimeRange({ startTime, endTime }: Pick<CourseMeetingTime, 'startTime' | 'endTime'>): string {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}
