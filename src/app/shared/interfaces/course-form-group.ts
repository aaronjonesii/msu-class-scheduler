import { FormArray, FormControl, FormGroup } from "@angular/forms";
import { Color } from "../enums/color";
import { CourseStatus } from "../enums/course-status";
import { CourseSectionFormGroup } from "./course-section-form-group";

export interface CourseFormGroup {
  id: FormControl<string | null>,
  name: FormControl<string>,
  description: FormControl<string | null>,
  status: FormControl<CourseStatus>,
  sections: FormArray<FormGroup<CourseSectionFormGroup>>
  startDate: FormControl<Date | null>,
  endDate: FormControl<Date | null>,
  color: FormControl<Color>,
  subjectCode: FormControl<string | null>,
  courseNumber: FormControl<number | null>,
  isNotMSUCourse: FormControl<boolean | null>,
  credits: FormControl<number>,
  selectedSectionId: FormControl<string | null>,
  notes: FormControl<string | null>,
}
