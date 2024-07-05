import { FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { ClassFormGroup } from "../interfaces/class-form";
import { Class } from "../interfaces/class";
import { ClassStatus } from "../enums/class-status";

export class ClassForm {
  formGroup: FormGroup<ClassFormGroup>;

  constructor(scheduleClass?: Class | null) {
    this.formGroup = this._buildForm(scheduleClass);
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

  get statusCtrl() {
    return this.formGroup.controls.status;
  }
  get status() {
    return this.statusCtrl.value;
  }

  get meetingsCtrl() {
    return this.formGroup.controls.meetings;
  }
  get meetings() {
    return this.meetingsCtrl.value;
  }

  get scheduleClass(): Class {
    return {
      id: this.id || null,
      name: this.name,
      description: this.description || null,
      status: this.status,
      meetings: this.meetings,
    };
  }

  updateForm(scheduleClass?: Class | null) {
    this.formGroup = this._buildForm(scheduleClass);
  }

  private _buildForm(scheduleClass?: Class | null) {
    return new FormGroup<ClassFormGroup>({
      id: new FormControl(scheduleClass?.id || null),
      name: new FormControl(
        scheduleClass?.name || '',
        { validators: Validators.required, nonNullable: true },
      ),
      description: new FormControl(scheduleClass?.description || null),
      status: new FormControl(
        scheduleClass?.status || ClassStatus.OPEN,
        { validators: Validators.required, nonNullable: true },
      ),
      meetings: new FormArray<FormGroup>([]),
    });
  }
}
