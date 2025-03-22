import {
  ScheduleClassMeeting,
} from "./schedule-class-meeting";
import { DateTime } from "./date-time";
import { FieldValue, Timestamp } from "@angular/fire/firestore";
import { Color } from "../enums/color";

export interface SemesterPlanCourse {
  name: string,
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
  sections: SemesterPlanCourseSection[],
}

export interface ReadSemesterPlanCourse extends SemesterPlanCourse {
  id: string,
  startDate?: Timestamp | null,
  endDate?: Timestamp | null,
  created?: Timestamp | null,
  updated?: Timestamp | null,
}

export interface WriteSemesterPlanCourse extends SemesterPlanCourse {
  startDate?: FieldValue | null,
  endDate?: FieldValue | null,
  created?: FieldValue | null,
  updated?: FieldValue | null,
}

export interface SemesterPlanCourseSection {
  id: string,
  startDate?: DateTime | null,
  endDate?: DateTime | null,
  meetings: ScheduleClassMeeting[],
}
