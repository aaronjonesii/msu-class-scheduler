import { DateTime, ReadDateTime, WriteDateTime } from "./date-time";
import { ReadScheduleClass, ScheduleClass } from "./schedule-class";

export interface SemesterPlan {
  id?: string,
  userId?: string,
  name: string,
  description: string | null,
  classes?: ScheduleClass[],
  created?: DateTime,
  updated?: DateTime,
}

export interface WriteSemesterPlan extends SemesterPlan {
  userId: string,
  created?: WriteDateTime,
  updated?: WriteDateTime,
}

export interface ReadSemesterPlan extends SemesterPlan {
  id: string,
  userId: string,
  created?: ReadDateTime,
  updated?: ReadDateTime,
}

export interface ReadSemesterPlanWithClasses extends ReadSemesterPlan {
  classes: ReadScheduleClass[],
}