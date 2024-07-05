import { ClassStatus } from "../enums/class-status";
import {
  ClassMeeting,
  ReadClassMeeting,
  WriteClassMeeting
} from "./class-meeting";
import { DateTime } from "./date-time";
import { FieldValue, Timestamp } from "@angular/fire/firestore";

export interface Class {
  name: string,
  status: ClassStatus,
  meetings: ClassMeeting[],
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

export interface ReadClass extends Class {
  id: string,
  meetings: ReadClassMeeting[],
  startDate?: Timestamp,
  endDate?: Timestamp,
  created?: Timestamp,
  updated?: Timestamp,
}

export interface WriteClass extends Class {
  meetings: WriteClassMeeting[],
  startDate?: FieldValue,
  endDate?: FieldValue,
  created: FieldValue,
  updated?: FieldValue,
}
