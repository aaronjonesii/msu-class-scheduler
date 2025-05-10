import { Day } from "../enums/day";

export interface CourseMeetingTime {
  days: Day[],
  startTime: string,
  endTime: string,
}
