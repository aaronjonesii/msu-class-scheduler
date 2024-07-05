import { FormArray, FormControl, FormGroup } from "@angular/forms";
import { ClassStatus } from "../enums/class-status";

export interface ClassFormGroup {
  id: FormControl<string | null>,
  name: FormControl<string>,
  description: FormControl<string | null>,
  status: FormControl<ClassStatus>,
  meetings: FormArray<FormGroup>,
}
