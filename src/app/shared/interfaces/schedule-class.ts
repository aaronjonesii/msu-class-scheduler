import { ScheduleClassStatus } from "../enums/schedule-class-status";
import {
  ScheduleClassMeeting,
  ReadScheduleClassMeeting,
  WriteScheduleClassMeeting
} from "./schedule-class-meeting";
import { DateTime } from "./date-time";
import { FieldValue, Timestamp } from "@angular/fire/firestore";

export interface ScheduleClass {
  name: string,
  status: ScheduleClassStatus,
  meetings: ScheduleClassMeeting[],
  id?: string | null,
  subjectCode?: string,
  courseNumber?: number,
  description?: string | null,
  term?: string,
  credits?: number,
  startDate?: DateTime,
  endDate?: DateTime,
  notes?: string,
  created?: DateTime,
  updated?: DateTime,
}

export interface ReadScheduleClass extends ScheduleClass {
  id: string,
  meetings: ReadScheduleClassMeeting[],
  startDate?: Timestamp,
  endDate?: Timestamp,
  created?: Timestamp,
  updated?: Timestamp,
}

export interface WriteScheduleClass extends ScheduleClass {
  meetings: WriteScheduleClassMeeting[],
  startDate?: FieldValue,
  endDate?: FieldValue,
  created: FieldValue,
  updated?: FieldValue,
}
