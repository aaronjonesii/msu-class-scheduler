import { FormArray, FormControl, FormGroup } from "@angular/forms";
import { ScheduleClassStatus } from "../enums/schedule-class-status";

export interface ScheduleClassFormGroup {
  id: FormControl<string | null>,
  name: FormControl<string>,
  description: FormControl<string | null>,
  status: FormControl<ScheduleClassStatus>,
  meetings: FormArray<FormGroup>,
}
