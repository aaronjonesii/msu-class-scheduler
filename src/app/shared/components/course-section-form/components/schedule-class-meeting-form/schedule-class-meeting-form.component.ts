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
import {
  ScheduleClassMeetingType
} from "../../../../enums/schedule-class-meeting-type";
import { KeyValuePipe } from "@angular/common";
import { MatInput } from "@angular/material/input";
import { provideNativeDateAdapter } from "@angular/material/core";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { Day } from "../../../../enums/day";
import { MatChipListbox, MatChipOption } from "@angular/material/chips";
import {
  MatButtonToggle,
  MatButtonToggleGroup
} from "@angular/material/button-toggle";

@Component({
  selector: 'csb-schedule-class-meeting-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    KeyValuePipe,
    MatInput,
    MatButton,
    MatIcon,
    MatChipListbox,
    MatChipOption,
    MatButtonToggleGroup,
    MatButtonToggle,
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

  readonly removeMeeting = output();

  addMeetingTime() {
    this.meetingFormGroup().controls.meetingTimes.push(
      new ScheduleClassForm().newMeetingTimeFormGroup(),
    );
  }

  keepSameOrder() { return 1; }
}
