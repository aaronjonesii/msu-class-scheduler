import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormArray, FormGroup } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import {
  ScheduleClassMeetingFormGroup
} from "../../../../interfaces/schedule-class-meeting-form";
import {
  ScheduleClassMeetingFormComponent
} from "../schedule-class-meeting-form/schedule-class-meeting-form.component";
import { ScheduleCourseForm } from "../../../../forms/schedule-course-form";

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
    input(new FormArray<FormGroup<ScheduleClassMeetingFormGroup>>([]));

  addMeeting() {
    this.meetingsFormArray().push(new ScheduleCourseForm().newMeetingFormGroup());
  }
}
