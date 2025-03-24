import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import { ReactiveFormsModule } from "@angular/forms";
import { ScheduleCourseForm } from "../../forms/schedule-course-form";
import {
  MatFormFieldAppearance, MatFormFieldModule,
} from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import {
  MatDatepickerModule,
} from "@angular/material/datepicker";
import { MatOption, provideNativeDateAdapter } from "@angular/material/core";
import { MatSelect, MatSelectTrigger } from "@angular/material/select";
import { ScheduleCourseStatus } from "../../enums/schedule-course-status";
import { KeyValuePipe } from "@angular/common";
import {
  ScheduleClassMeetingsFormComponent
} from "./components/schedule-class-meetings-form/schedule-class-meetings-form.component";
import { Color } from "../../enums/color";
import { MatIcon } from "@angular/material/icon";
import { MatListItemIcon } from "@angular/material/list";
import { ColorToClassPipe } from "../../pipes/color-to-class.pipe";
import { MatCheckbox } from "@angular/material/checkbox";

@Component({
  selector: 'csb-schedule-course-form',
  standalone: true,
  templateUrl: './schedule-course-form.component.html',
  styleUrl: './schedule-course-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule, MatFormFieldModule,
    MatInput, MatDatepickerModule, MatSelect,
    KeyValuePipe, MatOption,
    ScheduleClassMeetingsFormComponent,
    MatIcon, MatListItemIcon, MatSelectTrigger, ColorToClassPipe, MatCheckbox,
  ],
})
export class ScheduleCourseFormComponent {
  protected readonly ScheduleClassStatus = ScheduleCourseStatus;
  protected readonly Color = Color;

  classForm = input<ScheduleCourseForm>(new ScheduleCourseForm());

  formAppearance: MatFormFieldAppearance = 'outline';
}
