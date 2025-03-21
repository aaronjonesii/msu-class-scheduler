import { FormArray, FormControl, FormGroup } from "@angular/forms";
import { CourseMeetingType } from "../enums/course-meeting-type";
import { CourseMeetingTimesFormGroup } from "./course-meeting-times-form-group";

export interface CourseMeetingFormGroup {
  type: FormControl<CourseMeetingType>,
  location: FormControl<string | null>,
  instructor: FormControl<string | null>,
  meetingTimes: FormArray<FormGroup<CourseMeetingTimesFormGroup>>,
}
