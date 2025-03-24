import { FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { ReadScheduleCourse } from "../interfaces/schedule-course";
import { ScheduleCourseStatus } from "../enums/schedule-course-status";
import { ScheduleClassFormGroup } from "../interfaces/schedule-class-form";
import { Timestamp } from "@angular/fire/firestore";
import { ScheduleCourseMeetingType } from "../enums/schedule-course-meeting-type";
import {
  ScheduleClassMeetingFormGroup
} from "../interfaces/schedule-class-meeting-form";
import {
  ScheduleClassMeetingTimesFormGroup
} from "../interfaces/schedule-class-meeting-times-form-group";
import {
  ScheduleCourseMeetingTime
} from "../interfaces/schedule-course-meeting-time";
import { Day } from "../enums/day";
import { ScheduleCourseMeeting } from "../interfaces/schedule-course-meeting";
import { DefaultColor } from "../enums/color";

export class ScheduleCourseForm {
  formGroup: FormGroup<ScheduleClassFormGroup>;

  constructor(scheduleClass?: ReadScheduleCourse | null) {
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

    const meetings: ScheduleCourseMeeting[] = this.meetingsFormArray.value
      .map((m) => {
        const meetingTimes: ScheduleCourseMeetingTime[] = m.meetingTimes?.map((mt) => {
          return {
            days: mt.days as Day[],
            startTime: mt.startTime as string,
            endTime: mt.endTime as string,
          };
        }) || [];

        return {
          type: m?.type || ScheduleCourseMeetingType.RECITATION,
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

  get isNotMSUCourseCtrl() {
    return this.formGroup.controls.isNotMSUCourse;
  }
  get isNotMSUCourse() {
    return this.isNotMSUCourseCtrl.value;
  }

  get subjectCodeCtrl() {
    return this.formGroup.controls.subjectCode;
  }
  get subjectCode() {
    return this.subjectCodeCtrl.value;
  }

  get courseNumberCtrl() {
    return this.formGroup.controls.courseNumber;
  }
  get courseNumber() {
    return this.courseNumberCtrl.value;
  }

  get creditsCtrl() {
    return this.formGroup.controls.credits;
  }
  get credits() {
    return this.creditsCtrl.value;
  }

  get scheduleClass(): ReadScheduleCourse {
    return {
      id: this.id || '',
      name: this.name,
      description: this.description || null,
      status: this.status,
      meetings: this.meetings,
      startDate: this.startDate ? this._dateToTimestamp(this.startDate) : null,
      endDate: this.endDate ? this._dateToTimestamp(this.endDate) : null,
      color: this.color || null,
      subjectCode: this.subjectCode?.toUpperCase() || null,
      courseNumber: this.courseNumber || null,
      isNotMSUCourse: this.isNotMSUCourse || null,
      credits: this.credits || 0,
    };
  }

  updateForm(scheduleClass?: ReadScheduleCourse | null) {
    this.formGroup = this._buildForm(scheduleClass);
  }

  newMeetingFormGroup(scheduleClassMeeting?: ScheduleCourseMeeting) {
    const meetingTimesFormArray = new FormArray<FormGroup<ScheduleClassMeetingTimesFormGroup>>(
      scheduleClassMeeting?.meetingTimes ?
        scheduleClassMeeting.meetingTimes
          .map((mt) => this.newMeetingTimeFormGroup(mt)) : [],
    );

    return new FormGroup<ScheduleClassMeetingFormGroup>({
      type: new FormControl(
        scheduleClassMeeting?.type || ScheduleCourseMeetingType.LECTURE,
        { nonNullable: true, validators: Validators.required },
      ),
      location: new FormControl(scheduleClassMeeting?.location || null),
      instructor: new FormControl(scheduleClassMeeting?.instructor || null),
      meetingTimes: meetingTimesFormArray,
    });
  }

  newMeetingTimeFormGroup(meetingTime?: ScheduleCourseMeetingTime) {
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

  private _buildForm(scheduleClass?: ReadScheduleCourse | null) {
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
        scheduleClass?.status || ScheduleCourseStatus.OPEN,
        { validators: Validators.required, nonNullable: true },
      ),
      meetings: meetingsFormArray,
      startDate: new FormControl(scheduleClass?.startDate?.toDate() || null),
      endDate: new FormControl(scheduleClass?.endDate?.toDate() || null),
      color: new FormControl(
        scheduleClass?.color || DefaultColor,
        { validators: Validators.required, nonNullable: true },
      ),
      subjectCode: new FormControl(scheduleClass?.subjectCode || null),
      courseNumber: new FormControl(scheduleClass?.courseNumber || null),
      isNotMSUCourse: new FormControl(
        scheduleClass?.isNotMSUCourse || null,
      ),
      credits: new FormControl(
        scheduleClass?.credits || 0,
        { validators: Validators.required, nonNullable: true },
      ),
    });
  }

  private _dateToTimestamp(date: Date): Timestamp {
    return Timestamp.fromDate(date);
  }
}
