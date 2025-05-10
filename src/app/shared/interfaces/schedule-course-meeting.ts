import { ScheduleCourseMeetingType } from "../enums/schedule-course-meeting-type";
import { ScheduleCourseMeetingTime } from "./schedule-course-meeting-time";

export interface ScheduleCourseMeeting {
  type: ScheduleCourseMeetingType,
  location?: string | null,
  instructor?: string | null,
  meetingTimes: ScheduleCourseMeetingTime[],
}
