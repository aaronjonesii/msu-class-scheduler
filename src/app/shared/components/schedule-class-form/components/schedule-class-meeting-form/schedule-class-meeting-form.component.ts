import {
  ChangeDetectionStrategy,
  Component,
  input,
  output
} from '@angular/core';
import { ScheduleClassForm } from "../../../../forms/schedule-class-form";
import { ReactiveFormsModule } from "@angular/forms";
import {
  MatFormFieldAppearance,
  MatFormFieldModule
} from "@angular/material/form-field";
import { MatOption, MatSelect } from "@angular/material/select";
import {
  ScheduleClassMeetingType
} from "../../../../enums/schedule-class-meeting-type";
import { KeyValuePipe } from "@angular/common";
import { MatInput } from "@angular/material/input";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { provideNativeDateAdapter } from "@angular/material/core";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { Day } from "../../../../enums/day";

@Component({
  selector: 'csb-schedule-class-meeting-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelect,
    KeyValuePipe,
    MatOption,
    MatInput,
    MatDatepickerModule,
    MatButton,
    MatIcon,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './schedule-class-meeting-form.component.html',
  styleUrl: './schedule-class-meeting-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleClassMeetingFormComponent {
  protected readonly ScheduleClassMeetingType = ScheduleClassMeetingType;
  protected readonly Day = Day;

  meetingFormGroup = input(
    new ScheduleClassForm().newMeetingFormGroup(),
  );

  formAppearance = input<MatFormFieldAppearance>('outline');

  removeMeeting = output();

  addMeetingTime() {
    this.meetingFormGroup().controls.meetingTimes.push(
      new ScheduleClassForm().newMeetingTimeFormGroup(),
    );
  }

  keepSameOrder() { return 1; }
}
