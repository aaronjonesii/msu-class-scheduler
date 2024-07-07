import { FormArray, FormControl, FormGroup } from "@angular/forms";
import { ScheduleClassStatus } from "../enums/schedule-class-status";
import { ScheduleClassMeetingFormGroup } from "./schedule-class-meeting-form";
import { Color } from "../enums/color";

export interface ScheduleClassFormGroup {
  id: FormControl<string | null>,
  name: FormControl<string>,
  description: FormControl<string | null>,
  status: FormControl<ScheduleClassStatus>,
  meetings: FormArray<FormGroup<ScheduleClassMeetingFormGroup>>,
  startDate: FormControl<Date | null>,
  endDate: FormControl<Date | null>,
  color: FormControl<Color>,
  subjectCode: FormControl<string | null>,
  courseNumber: FormControl<number | null>,
  isNotMSUCourse: FormControl<boolean | null>,
  credits: FormControl<number>,
}
