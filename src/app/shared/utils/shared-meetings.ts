import { CourseMeeting } from "../interfaces/course-meeting";
import { CourseSection } from "../interfaces/course-section";

/** Firestore doesn't keep the order of a document's keys, so this names each field. */
function meetingKey({ type, location, instructor, meetingTimes }: CourseMeeting): string {
  const times = meetingTimes.map(({ days, startTime, endTime }) => [days, startTime, endTime]);

  return JSON.stringify([type, location ?? null, instructor ?? null, times]);
}

/** The meetings every section has, like one lecture shared by several labs. */
export function sharedMeetings(sections: CourseSection[]): CourseMeeting[] {
  if (sections.length < 2) return [];

  const [first, ...others] = sections;

  return first.meetings.filter((meeting) => {
    const key = meetingKey(meeting);

    return others.every((section) => section.meetings.some((other) => meetingKey(other) === key));
  });
}

/** What a section has apart from the meetings shared by every section. */
export function ownMeetings(section: CourseSection, shared: CourseMeeting[]): CourseMeeting[] {
  const sharedKeys = shared.map(meetingKey);

  return section.meetings.filter((meeting) => !sharedKeys.includes(meetingKey(meeting)));
}
