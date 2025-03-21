import { FormArray, FormControl, FormGroup } from "@angular/forms";
import { CourseMeetingFormGroup } from "./course-meeting-form-group";

export interface CourseSectionFormGroup {
  id: FormControl<string | null>,
  startDate: FormControl<Date | null>,
  endDate: FormControl<Date | null>,
  meetings: FormArray<FormGroup<CourseMeetingFormGroup>>,
}
