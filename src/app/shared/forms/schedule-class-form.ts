import { FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { ReadScheduleClass } from "../interfaces/schedule-class";
import { ScheduleClassStatus } from "../enums/schedule-class-status";
import { ScheduleClassFormGroup } from "../interfaces/schedule-class-form";
import { Timestamp } from "@angular/fire/firestore";
import { ScheduleClassMeetingType } from "../enums/schedule-class-meeting-type";
import {
  ScheduleClassMeetingFormGroup
} from "../interfaces/schedule-class-meeting-form";
import {
  ScheduleClassMeetingTimesFormGroup
} from "../interfaces/schedule-class-meeting-times-form-group";
import {
  ScheduleClassMeetingTime
} from "../interfaces/schedule-class-meeting-time";
import { Day } from "../enums/day";
import { ScheduleClassMeeting } from "../interfaces/schedule-class-meeting";
import { DefaultColor } from "../enums/color";

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

  get meetingsFormArray() {
    return this.formGroup.controls.meetings;
  }
  get meetings() {
    if (!this.meetingsFormArray.value.length) return [];

    const meetings: ScheduleClassMeeting[] = this.meetingsFormArray.value
      .map((m) => {
        const meetingTimes: ScheduleClassMeetingTime[] = m.meetingTimes?.map((mt) => {
          return {
            days: mt.days as Day[],
            startTime: mt.startTime as string,
            endTime: mt.endTime as string,
          };
        }) || [];

        return {
          type: m?.type || ScheduleClassMeetingType.RECITATION,
          location: m?.location || null,
          instructor: m?.instructor || null,
          meetingTimes,
        };
      });

    return meetings;
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

  get colorCtrl() {
    return this.formGroup.controls.color;
  }
  get color() {
    return this.colorCtrl.value;
  }

  get scheduleClass(): ReadScheduleClass {
    return {
      id: this.id || '',
      name: this.name,
      description: this.description || null,
      status: this.status,
      meetings: this.meetings,
      startDate: this.startDate ? this._dateToTimestamp(this.startDate) : null,
      endDate: this.endDate ? this._dateToTimestamp(this.endDate) : null,
      color: this.color || null,
    };
  }

  updateForm(scheduleClass?: ReadScheduleClass | null) {
    this.formGroup = this._buildForm(scheduleClass);
  }

  newMeetingFormGroup(scheduleClassMeeting?: ScheduleClassMeeting) {
    const meetingTimesFormArray = new FormArray<FormGroup<ScheduleClassMeetingTimesFormGroup>>(
      scheduleClassMeeting?.meetingTimes ?
        scheduleClassMeeting.meetingTimes
          .map((mt) => this.newMeetingTimeFormGroup(mt)) : [],
    );

    return new FormGroup<ScheduleClassMeetingFormGroup>({
      type: new FormControl(
        scheduleClassMeeting?.type || ScheduleClassMeetingType.LECTURE,
        { nonNullable: true, validators: Validators.required },
      ),
      location: new FormControl(scheduleClassMeeting?.location || null),
      instructor: new FormControl(scheduleClassMeeting?.instructor || null),
      meetingTimes: meetingTimesFormArray,
    });
  }

  newMeetingTimeFormGroup(meetingTime?: ScheduleClassMeetingTime) {
    return new FormGroup<ScheduleClassMeetingTimesFormGroup>({
      days: new FormControl(
        meetingTime?.days || [],
        { nonNullable: true, validators: Validators.required },
      ),
      startTime: new FormControl(
        meetingTime?.startTime || '15:00',
        { nonNullable: true, validators: Validators.required },
      ),
      endTime: new FormControl(
        meetingTime?.endTime || '17:00',
        { nonNullable: true, validators: Validators.required },
      ),
    });
  }

  private _buildForm(scheduleClass?: ReadScheduleClass | null) {
    const meetingsFormArray =
      new FormArray<FormGroup<ScheduleClassMeetingFormGroup>>(
        scheduleClass?.meetings ?
          scheduleClass?.meetings
            .map((m) => this.newMeetingFormGroup(m)) : [],
      );

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
      meetings: meetingsFormArray,
      startDate: new FormControl(scheduleClass?.startDate?.toDate() || null),
      endDate: new FormControl(scheduleClass?.endDate?.toDate() || null),
      color: new FormControl(
        scheduleClass?.color || DefaultColor,
        { validators: Validators.required, nonNullable: true },
      ),
    });
  }

  private _dateToTimestamp(date: Date): Timestamp {
    return Timestamp.fromDate(date);
  }
}
