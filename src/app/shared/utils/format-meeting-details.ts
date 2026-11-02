import { CourseMeeting } from "../interfaces/course-meeting";

/** The rooms and instructors of a section, each listed once. */
export function formatMeetingDetails(meetings: CourseMeeting[]): string {
  const details = meetings.flatMap((m) => [m.location, m.instructor]);

  return [...new Set(details.filter((detail) => !!detail))].join(' · ');
}
