import { ScheduleCourseStatus } from "../enums/schedule-course-status";
import {
  ScheduleCourseMeeting,
} from "./schedule-course-meeting";
import { DateTime } from "./date-time";
import { FieldValue, Timestamp } from "@angular/fire/firestore";
import { Color } from "../enums/color";

export interface ScheduleCourse {
  name: string,
  status: ScheduleCourseStatus,
  meetings: ScheduleCourseMeeting[],
  id?: string | null,
  subjectCode?: string | null,
  courseNumber?: number | null,
  description?: string | null,
  term?: string | null,
  credits?: number | null,
  startDate?: DateTime | null,
  endDate?: DateTime | null,
  notes?: string | null,
  created?: DateTime | null,
  updated?: DateTime | null,
  color?: Color | null,
  isNotMSUCourse: boolean | null,
  sections?: ScheduleCourseSection[],
}

export interface ReadScheduleCourse extends ScheduleCourse {
  id: string,
  startDate?: Timestamp | null,
  endDate?: Timestamp | null,
  created?: Timestamp | null,
  updated?: Timestamp | null,
}

export interface WriteScheduleCourse extends ScheduleCourse {
  startDate?: FieldValue | null,
  endDate?: FieldValue | null,
  created?: FieldValue | null,
  updated?: FieldValue | null,
}

export interface ScheduleCourseSection {
  id: string,
  startDate?: DateTime | null,
  endDate?: DateTime | null,
  meetings: ScheduleCourseMeeting[],
}
