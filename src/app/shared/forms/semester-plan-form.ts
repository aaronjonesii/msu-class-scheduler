import { FormControl, FormGroup, Validators } from "@angular/forms";
import { SemesterPlanFormGroup } from "../interfaces/semester-plan-form";
import { ReadSemesterPlan } from "../interfaces/semester-plan";
import { SemesterTerm } from "../enums/semester-term";

export class SemesterPlanForm {
  formGroup: FormGroup<SemesterPlanFormGroup>;

  constructor(semesterPlan?: ReadSemesterPlan | null) {
    this.formGroup = this._buildForm(semesterPlan);
  }

  get idCtrl() {
    return this.formGroup.controls.id;
  }
  get id() {
    return this.formGroup.controls.id.value;
  }

  get nameCtrl() {
    return this.formGroup.controls.name;
  }
  get name() {
    return this.formGroup.controls.name.value;
  }

  get descriptionCtrl() {
    return this.formGroup.controls.description;
  }
  get description() {
    return this.formGroup.controls.description.value;
  }

  get yearCtrl() {
    return this.formGroup.controls.year;
  }
  get year() {
    return this.yearCtrl.value;
  }

  get termCtrl() {
    return this.formGroup.controls.term;
  }
  get term() {
    return this.termCtrl.value;
  }

  get userIdCtrl() {
    return this.formGroup.controls.userId;
  }
  get userId() {
    return this.userIdCtrl.value;
  }
  set userId(userId: string) {
    this.userIdCtrl.setValue(userId);
  }

  get semesterPlan(): ReadSemesterPlan {
    return {
      id: this.id || '',
      userId: this.userId || '',
      name: this.name,
      description: this.description || null,
      year: this.year,
      term: this.term,
      courses: [],
    };
  }

  updateForm(schedule?: ReadSemesterPlan | null) {
    this.formGroup = this._buildForm(schedule);
  }

  private _buildForm(schedule?: ReadSemesterPlan | null) {
    return new FormGroup<SemesterPlanFormGroup>({
      id: new FormControl(schedule?.id || null),
      userId: new FormControl(
        schedule?.userId || '',
        { validators: Validators.required, nonNullable: true },
      ),
      name: new FormControl(
        schedule?.name || '',
        { validators: Validators.required, nonNullable: true },
      ),
      description: new FormControl(schedule?.description || null),
      year: new FormControl(
        schedule?.year ?? new Date().getFullYear(),
        { validators: Validators.required, nonNullable: true },
      ),
      term: new FormControl(
        schedule?.term ?? SemesterTerm.SUMMER,
        { validators: Validators.required, nonNullable: true },
      )
    });
  }
}
