import { FormControl } from "@angular/forms";
import { Day } from "../enums/day";

export interface CourseMeetingTimesFormGroup {
  days: FormControl<Day[]>,
  startTime: FormControl<string>,
  endTime: FormControl<string>,
}
