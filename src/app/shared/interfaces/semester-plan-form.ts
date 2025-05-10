import { FormControl } from "@angular/forms";
import { SemesterTerm } from "../enums/semester-term";

export interface SemesterPlanFormGroup {
  id: FormControl<string | null>,
  userId: FormControl<string>,
  name: FormControl<string>,
  description: FormControl<string | null>,
  year: FormControl<number>,
  term: FormControl<SemesterTerm>
}
