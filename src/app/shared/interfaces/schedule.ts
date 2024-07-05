import { FieldValue, Timestamp } from "@angular/fire/firestore";
import { Class, ReadClass, WriteClass } from "./class";
import { DateTime } from "./date-time";

export interface Schedule {
  id?: string,
  userId: string,
  name: string,
  description: string | null,
  classes: Class[],
  created: DateTime,
  updated?: DateTime,
}

export interface WriteSchedule extends Schedule {
  classes: WriteClass[],
  created: FieldValue,
  updated?: FieldValue,
}

export interface ReadSchedule extends Schedule {
  id: string,
  classes: ReadClass[],
  created: Timestamp,
  updated?: Timestamp,
}
