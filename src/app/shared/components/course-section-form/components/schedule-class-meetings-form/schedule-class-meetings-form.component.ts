import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormArray, FormGroup } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import {
  ScheduleClassMeetingFormComponent
} from "../schedule-class-meeting-form/schedule-class-meeting-form.component";
import { CourseMeetingFormGroup } from "../../../../interfaces/course-meeting-form-group";
import { CourseForm } from "../../../../forms/course-form";

@Component({
  selector: 'csb-schedule-class-meetings-form',
  standalone: true,
  imports: [
    MatButton,
    MatIcon,
    ScheduleClassMeetingFormComponent
  ],
  templateUrl: './schedule-class-meetings-form.component.html',
  styleUrl: './schedule-class-meetings-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleClassMeetingsFormComponent {
  meetingsFormArray =
    input(new FormArray<FormGroup<CourseMeetingFormGroup>>([]));

  addMeeting() {
    this.meetingsFormArray().push(new CourseForm().newCourseMeetingFormGroup());
  }
}
