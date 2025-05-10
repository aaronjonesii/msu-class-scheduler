import { CourseMeetingType } from "../enums/course-meeting-type";
import { CourseMeetingTime } from "./course-meeting-time";

export interface CourseMeeting {
  type: CourseMeetingType,
  location?: string | null,
  instructor?: string | null,
  meetingTimes: CourseMeetingTime[],
}
