import { ScheduleClassMeetingType } from "../enums/schedule-class-meeting-type";
import { ScheduleClassMeetingTime } from "./schedule-class-meeting-time";

export interface ScheduleClassMeeting {
  type: ScheduleClassMeetingType,
  location?: string | null,
  instructor?: string | null,
  meetingTimes: ScheduleClassMeetingTime[],
}
