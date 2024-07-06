import { FieldValue, Timestamp } from "@angular/fire/firestore";
import { ScheduleClass, ReadScheduleClass } from "./schedule-class";
import { DateTime } from "./date-time";

export interface Schedule {
  id?: string,
  userId: string,
  name: string,
  description: string | null,
  classes?: ScheduleClass[],
  created?: DateTime,
  updated?: DateTime,
}

export interface WriteSchedule extends Schedule {
  created?: FieldValue,
  updated?: FieldValue,
}

export interface ReadSchedule extends Schedule {
  id: string,
  created?: Timestamp,
  updated?: Timestamp,
}

export interface ReadScheduleWithClasses extends ReadSchedule {
  classes: ReadScheduleClass[],
}
