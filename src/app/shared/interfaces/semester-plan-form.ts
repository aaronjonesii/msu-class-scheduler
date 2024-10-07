import { FormControl } from "@angular/forms";

export interface SemesterPlanFormGroup {
  id: FormControl<string | null>,
  userId: FormControl<string>,
  name: FormControl<string>,
  description: FormControl<string | null>,
}