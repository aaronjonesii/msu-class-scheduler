import { FormArray, FormControl, FormGroup } from "@angular/forms";
import { ScheduleClassMeetingType } from "../enums/schedule-class-meeting-type";
import {
  ScheduleClassMeetingTimesFormGroup
} from "./schedule-class-meeting-times-form-group";

export interface ScheduleClassMeetingFormGroup {
  type: FormControl<ScheduleClassMeetingType>,
  location: FormControl<string | null>,
  instructor: FormControl<string | null>,
  meetingTimes: FormArray<FormGroup<ScheduleClassMeetingTimesFormGroup>>,
}
