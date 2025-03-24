import { ScheduleCourse, ReadScheduleCourse } from "./schedule-course";
import { DateTime, ReadDateTime, WriteDateTime } from "./date-time";

export interface Schedule {
  id?: string,
  userId?: string,
  name: string,
  description: string | null,
  courses?: ScheduleCourse[],
  created?: DateTime,
  updated?: DateTime,
}

export interface WriteSchedule extends Schedule {
  userId: string,
  created?: WriteDateTime,
  updated?: WriteDateTime,
}

export interface ReadSchedule extends Schedule {
  id: string,
  userId: string,
  created?: ReadDateTime,
  updated?: ReadDateTime,
}

export interface ReadScheduleWithCourses extends ReadSchedule {
  courses: ReadScheduleCourse[],
}
