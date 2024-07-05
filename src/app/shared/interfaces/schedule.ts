import { FieldValue, Timestamp } from "@angular/fire/firestore";
import { ScheduleClass, ReadScheduleClass, WriteScheduleClass } from "./schedule-class";
import { DateTime } from "./date-time";

export interface Schedule {
  id?: string,
  userId: string,
  name: string,
  description: string | null,
  classes: ScheduleClass[],
  created: DateTime,
  updated?: DateTime,
}

export interface WriteSchedule extends Schedule {
  classes: WriteScheduleClass[],
  created: FieldValue,
  updated?: FieldValue,
}

export interface ReadSchedule extends Schedule {
  id: string,
  classes: ReadScheduleClass[],
  created: Timestamp,
  updated?: Timestamp,
}
