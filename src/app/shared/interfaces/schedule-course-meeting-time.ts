import { Day } from "../enums/day";

export interface ScheduleCourseMeetingTime {
  days: Day[],
  startTime: string,
  endTime: string,
}
