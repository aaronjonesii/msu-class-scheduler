import { FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { ReadScheduleClass } from "../interfaces/schedule-class";
import { ScheduleClassStatus } from "../enums/schedule-class-status";
import { ScheduleClassFormGroup } from "../interfaces/schedule-class-form";
import { Timestamp } from "@angular/fire/firestore";

export class ScheduleClassForm {
  formGroup: FormGroup<ScheduleClassFormGroup>;

  constructor(scheduleClass?: ReadScheduleClass | null) {
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

  get startDateCtrl() {
    return this.formGroup.controls.startDate;
  }
  get startDate() {
    return this.startDateCtrl.value;
  }

  get endDateCtrl() {
    return this.formGroup.controls.endDate;
  }
  get endDate() {
    return this.endDateCtrl.value;
  }

  get scheduleClass(): ReadScheduleClass {
    return {
      id: this.id || '',
      name: this.name,
      description: this.description || null,
      status: this.status,
      meetings: this.meetings,
      startDate: this.startDate ? Timestamp.fromDate(this.startDate) : null,
      endDate: this.endDate ? Timestamp.fromDate(this.endDate) : null,
    };
  }

  updateForm(scheduleClass?: ReadScheduleClass | null) {
    this.formGroup = this._buildForm(scheduleClass);
  }

  private _buildForm(scheduleClass?: ReadScheduleClass | null) {
    return new FormGroup<ScheduleClassFormGroup>({
      id: new FormControl(scheduleClass?.id || null),
      name: new FormControl(
        scheduleClass?.name || '',
        { validators: Validators.required, nonNullable: true },
      ),
      description: new FormControl(scheduleClass?.description || null),
      status: new FormControl(
        scheduleClass?.status || ScheduleClassStatus.OPEN,
        { validators: Validators.required, nonNullable: true },
      ),
      meetings: new FormArray<FormGroup>([]),
      startDate: new FormControl(scheduleClass?.startDate?.toDate() || null),
      endDate: new FormControl(scheduleClass?.endDate?.toDate() || null),
    });
  }
}
