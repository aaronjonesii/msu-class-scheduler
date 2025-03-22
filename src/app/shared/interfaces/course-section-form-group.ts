import { FormArray, FormControl, FormGroup } from "@angular/forms";
import { CourseMeetingFormGroup } from "./course-meeting-form-group";

export interface CourseSectionFormGroup {
  id: FormControl<string | null>,
  name: FormControl<string>,
  meetings: FormArray<FormGroup<CourseMeetingFormGroup>>,
}
