import { FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { CourseFormGroup } from "../interfaces/course-form-group";
import { ReadCourse } from "../interfaces/course";
import { CourseStatus } from "../enums/course-status";
import { DefaultColor } from "../enums/color";
import { CourseSectionFormGroup } from "../interfaces/course-section-form-group";
import { CourseMeetingFormGroup } from "../interfaces/course-meeting-form-group";
import { ReadCourseSection } from "../interfaces/course-section";
import { CourseMeetingTime } from "../interfaces/course-meeting-time";
import { CourseMeetingTimesFormGroup } from "../interfaces/course-meeting-times-form-group";
import { CourseMeeting } from "../interfaces/course-meeting";
import { CourseMeetingType } from "../enums/course-meeting-type";
import { dateToTimestamp } from "../utils/date-to-timestamp";
import { Day } from "../enums/day";

export class CourseForm {
  formGroup: FormGroup<CourseFormGroup>;

  constructor(course?: ReadCourse | null) {
    this.formGroup = this._buildForm(course);
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

  get sectionsFormArray() {
    return this.formGroup.controls.sections;
  }
  get sections(): ReadCourseSection[] {
    if (!this.sectionsFormArray.value.length) return [];

    return this.sectionsFormArray.value.map((s) => {
      const meetings: CourseMeeting[] = (s.meetings || [])
        .map((m) => {
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
        });

      return {
        id: s.id || '',
        name: s.name || '',
        meetings,
      };
    });
  }

  get course(): ReadCourse {
    return {
      id: this.id || '',
      name: this.name,
      description: this.description || null,
      status: this.status,
      startDate: this.startDate ? dateToTimestamp(this.startDate) : null,
      endDate: this.endDate ? dateToTimestamp(this.endDate) : null,
      color: this.color || null,
      subjectCode: this.subjectCode?.toUpperCase() || null,
      courseNumber: this.courseNumber || null,
      isNotMSUCourse: this.isNotMSUCourse || null,
      credits: this.credits || 0,
      sections: this.sections || [],
    };
  }

  newCourseMeetingTimeFormGroup(courseMeetingTime?: CourseMeetingTime) {
    return new FormGroup<CourseMeetingTimesFormGroup>({
      days: new FormControl(
        courseMeetingTime?.days || [],
        { nonNullable: true, validators: Validators.required },
      ),
      startTime: new FormControl(
        courseMeetingTime?.startTime || '15:00',
        { nonNullable: true, validators: Validators.required },
      ),
      endTime: new FormControl(
        courseMeetingTime?.endTime || '17:00',
        { nonNullable: true, validators: Validators.required },
      ),
    });
  }

  newCourseMeetingFormGroup(courseMeeting?: CourseMeeting) {
    const meetingTimesFormArray = new FormArray<FormGroup<CourseMeetingTimesFormGroup>>(
      courseMeeting?.meetingTimes ?
        courseMeeting.meetingTimes
          .map((mt) => this.newCourseMeetingTimeFormGroup(mt)) : [],
    );

    return new FormGroup<CourseMeetingFormGroup>({
      type: new FormControl(
        courseMeeting?.type || CourseMeetingType.LECTURE,
        { nonNullable: true, validators: Validators.required },
      ),
      location: new FormControl(courseMeeting?.location || null),
      instructor: new FormControl(courseMeeting?.instructor || null),
      meetingTimes: meetingTimesFormArray,
    });
  }

  newCourseSectionFormGroup(section?: ReadCourseSection) {
    return new FormGroup<CourseSectionFormGroup>({
      id: new FormControl(
        section?.id || '',
        { nonNullable: true, validators: Validators.required }
      ),
      name: new FormControl(
        section?.name || '',
        { nonNullable: true, validators: Validators.required }
      ),
      meetings: new FormArray<FormGroup<CourseMeetingFormGroup>>(
        section?.meetings ? section.meetings.map((m) => this.newCourseMeetingFormGroup(m)) : []
      ),
    });
  }

  private _buildForm(course?: ReadCourse | null) {
    const sectionsFormArray = new FormArray<FormGroup<CourseSectionFormGroup>>(
      course?.sections ? course.sections.map((s) => this.newCourseSectionFormGroup(s)) : []
    );

    return new FormGroup<CourseFormGroup>({
      id: new FormControl(course?.id || null),
      name: new FormControl(
        course?.name || '',
        { validators: Validators.required, nonNullable: true },
      ),
      description: new FormControl(course?.description || null),
      status: new FormControl(
        course?.status || CourseStatus.OPEN,
        { validators: Validators.required, nonNullable: true },
      ),
      startDate: new FormControl(course?.startDate?.toDate() || null),
      endDate: new FormControl(course?.endDate?.toDate() || null),
      color: new FormControl(
        course?.color || DefaultColor,
        { validators: Validators.required, nonNullable: true },
      ),
      subjectCode: new FormControl(course?.subjectCode || null),
      courseNumber: new FormControl(course?.courseNumber || null),
      isNotMSUCourse: new FormControl(course?.isNotMSUCourse || null),
      credits: new FormControl(
        course?.credits || 0,
        { validators: Validators.required, nonNullable: true },
      ),
      notes: new FormControl(course?.notes || null),
      selectedSectionId: new FormControl(course?.selectedSectionId || null),
      sections: sectionsFormArray,
    });
  }
}
