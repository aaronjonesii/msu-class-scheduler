import { ScheduleClassStatus } from "../enums/schedule-class-status";
import {
  ScheduleClassMeeting,
} from "./schedule-class-meeting";
import { DateTime } from "./date-time";
import { FieldValue, Timestamp } from "@angular/fire/firestore";
import { Color } from "../enums/color";

export interface ScheduleClass {
  name: string,
  status: ScheduleClassStatus,
  meetings: ScheduleClassMeeting[],
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
  isMSUCourse: boolean,
}

export interface ReadScheduleClass extends ScheduleClass {
  id: string,
  startDate?: Timestamp | null,
  endDate?: Timestamp | null,
  created?: Timestamp | null,
  updated?: Timestamp | null,
}

export interface WriteScheduleClass extends ScheduleClass {
  startDate?: FieldValue | null,
  endDate?: FieldValue | null,
  created?: FieldValue | null,
  updated?: FieldValue | null,
}
