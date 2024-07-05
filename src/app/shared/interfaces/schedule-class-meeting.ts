import { ScheduleClassMeetingType } from "../enums/schedule-class-meeting-type";
import { DateTime } from "./date-time";
import { FieldValue, Timestamp } from "@angular/fire/firestore";

export interface ScheduleClassMeeting {
  type: ScheduleClassMeetingType,
  location?: string,
  instructor?: string,
  daysAndTimes: {
    start: DateTime,
    end: DateTime,
  }[],
}

export interface ReadScheduleClassMeeting extends ScheduleClassMeeting {
  daysAndTimes: {
    start: Timestamp,
    end: Timestamp,
  }[],
}

export interface WriteScheduleClassMeeting extends ScheduleClassMeeting {
  daysAndTimes: {
    start: FieldValue,
    end: FieldValue,
  }[],
}
