import { FormArray, FormControl, FormGroup } from "@angular/forms";
import { ScheduleClassStatus } from "../enums/schedule-class-status";
import { ScheduleClassMeetingFormGroup } from "./schedule-class-meeting-form";

export interface ScheduleClassFormGroup {
  id: FormControl<string | null>,
  name: FormControl<string>,
  description: FormControl<string | null>,
  status: FormControl<ScheduleClassStatus>,
  meetings: FormArray<FormGroup<ScheduleClassMeetingFormGroup>>,
  startDate: FormControl<Date | null>,
  endDate: FormControl<Date | null>,
}
