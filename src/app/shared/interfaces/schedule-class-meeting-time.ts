import { Day } from "../enums/day";

export interface ScheduleClassMeetingTime {
  days: Day[],
  startTime: string,
  endTime: string,
}
