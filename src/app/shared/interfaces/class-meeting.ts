import { ClassMeetingType } from "../enums/class-meeting-type";
import { DateTime } from "./date-time";
import { FieldValue, Timestamp } from "@angular/fire/firestore";

export interface ClassMeeting {
  type: ClassMeetingType,
  location?: string,
  instructor?: string,
  daysAndTimes: {
    start: DateTime,
    end: DateTime,
  }[],
}

export interface ReadClassMeeting extends ClassMeeting {
  daysAndTimes: {
    start: Timestamp,
    end: Timestamp,
  }[],
}

export interface WriteClassMeeting extends ClassMeeting {
  daysAndTimes: {
    start: FieldValue,
    end: FieldValue,
  }[],
}
