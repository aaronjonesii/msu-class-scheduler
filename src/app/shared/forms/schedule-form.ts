import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ScheduleFormGroup } from "../interfaces/schedule-form";
import { ReadSchedule } from "../interfaces/schedule";

export class ScheduleForm {
  formGroup: FormGroup<ScheduleFormGroup>;

  constructor(schedule?: ReadSchedule | null) {
    this.formGroup = this._buildForm(schedule);
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

  get userIdCtrl() {
    return this.formGroup.controls.userId;
  }
  get userId() {
    return this.userIdCtrl.value;
  }
  set userId(userId: string) {
    this.userIdCtrl.setValue(userId);
  }

  get schedule(): ReadSchedule {
    return {
      id: this.id || '',
      userId: this.userId || '',
      name: this.name,
      description: this.description || null,
      classes: [],
    };
  }

  updateForm(schedule?: ReadSchedule | null) {
    this.formGroup = this._buildForm(schedule);
  }

  private _buildForm(schedule?: ReadSchedule | null) {
    return new FormGroup<ScheduleFormGroup>({
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
    });
  }
}
