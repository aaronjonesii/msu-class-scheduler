import { FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { CourseSectionFormGroup } from "../interfaces/course-section-form-group";
import { ReadCourseSection } from "../interfaces/course-section";
import { CourseMeetingFormGroup } from "../interfaces/course-meeting-form-group";
import { CourseMeeting } from "../interfaces/course-meeting";
import { CourseMeetingTimesFormGroup } from "../interfaces/course-meeting-times-form-group";
import { CourseMeetingType } from "../enums/course-meeting-type";
import { CourseMeetingTime } from "../interfaces/course-meeting-time";
import { Day } from "../enums/day";

export class CourseSectionForm {
  formGroup: FormGroup<CourseSectionFormGroup>;

  constructor(section?: ReadCourseSection | null) {
    this.formGroup = this._buildForm(section);
  }

  get idCtrl() {
    return this.formGroup.controls.id;
  }
  get id() {
    return this.idCtrl.value;
  }

  get nameCtrl() {
    return this.formGroup.controls.name;
  }
  get name() {
    return this.nameCtrl.value;
  }

  get meetingsFormArray() {
    return this.formGroup.controls.meetings;
  }
  get meetings() {
    if (!this.meetingsFormArray.value.length) return [];
    return this.meetingsFormArray.value.map(m => {
      const meetingTimes: CourseMeetingTime[] = m.meetingTimes?.map((mt) => {
            return {
              days: mt.days as Day[],
              startTime: mt.startTime as string,
              endTime: mt.endTime as string,
            };
          }) || [];

      return {
        type: m?.type || CourseMeetingType.RECITATION,
        location: m?.location || null,
        instructor: m?.instructor || null,
        meetingTimes,
      };
    })
  }

  get section(): ReadCourseSection {
    return {
      id: this.id || '',
      name: this.name || '',
      meetings: this.meetings || [],
    };
  }

  newMeetingTimeFormGroup(meetingTime?: CourseMeetingTime) {
    return new FormGroup<CourseMeetingTimesFormGroup>({
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

  newMeetingFormGroup(meeting?: CourseMeeting) {
    const meetingTimesFormArray = new FormArray<FormGroup<CourseMeetingTimesFormGroup>>(
      meeting?.meetingTimes
        ? meeting.meetingTimes.map(mt => this.newMeetingTimeFormGroup(mt))
        : []
    );

    return new FormGroup<CourseMeetingFormGroup>({
      type: new FormControl(
        meeting?.type || CourseMeetingType.LECTURE,
        { nonNullable: true, validators: Validators.required },
      ),
      location: new FormControl(meeting?.location || null),
      instructor: new FormControl(meeting?.instructor || null),
      meetingTimes: meetingTimesFormArray,
    });
  }

  private _buildForm(section?: ReadCourseSection | null) {
    const meetingsFormArray = new FormArray<FormGroup<CourseMeetingFormGroup>>(
      section?.meetings
        ? section.meetings.map(m => this.newMeetingFormGroup(m))
        : []
    );

    return new FormGroup<CourseSectionFormGroup>({
      id: new FormControl(section?.id || null),
      name: new FormControl(
        section?.name || '',
        { nonNullable: true, validators: Validators.required },
      ),
      meetings: meetingsFormArray
    });
  }
}
