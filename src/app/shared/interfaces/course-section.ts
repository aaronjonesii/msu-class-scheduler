import { CourseMeeting } from "./course-meeting";
import { DateTime, ReadDateTime, WriteDateTime } from "./date-time";

export interface CourseSection {
  id?: string | null,
  startDate?: DateTime | null,
  endDate?: DateTime | null,
  meetings: CourseMeeting[],
  created?: DateTime | null,
  updated?: DateTime | null,
}

export interface ReadCourseSection extends CourseSection {
  id: string,
  startDate?: ReadDateTime | null,
  endDate?: ReadDateTime | null,
  created?: ReadDateTime | null,
  updated?: ReadDateTime | null,
}

export interface WriteCourseSection extends CourseSection {
  startDate?: WriteDateTime | null,
  endDate?: WriteDateTime | null,
  created?: WriteDateTime | null,
  updated?: WriteDateTime | null,
}
