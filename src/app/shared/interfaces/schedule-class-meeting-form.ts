import { FormArray, FormControl, FormGroup } from "@angular/forms";
import { ScheduleCourseMeetingType } from "../enums/schedule-course-meeting-type";
import {
  ScheduleClassMeetingTimesFormGroup
} from "./schedule-class-meeting-times-form-group";

export interface ScheduleClassMeetingFormGroup {
  type: FormControl<ScheduleCourseMeetingType>,
  location: FormControl<string | null>,
  instructor: FormControl<string | null>,
  meetingTimes: FormArray<FormGroup<ScheduleClassMeetingTimesFormGroup>>,
}
