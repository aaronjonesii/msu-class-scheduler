import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import { ReactiveFormsModule } from "@angular/forms";
import { ScheduleClassForm } from "../../forms/schedule-class-form";
import {
  MatFormFieldAppearance, MatFormFieldModule,
} from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import {
  MatDatepickerModule,
} from "@angular/material/datepicker";
import { MatOption, provideNativeDateAdapter } from "@angular/material/core";
import { MatSelect, MatSelectTrigger } from "@angular/material/select";
import { ScheduleClassStatus } from "../../enums/schedule-class-status";
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
  selector: 'csb-schedule-class-form',
  standalone: true,
  templateUrl: './schedule-class-form.component.html',
  styleUrl: './schedule-class-form.component.scss',
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
export class ScheduleClassFormComponent {
  protected readonly ScheduleClassStatus = ScheduleClassStatus;
  protected readonly Color = Color;

  classForm = input<ScheduleClassForm>(new ScheduleClassForm());

  formAppearance: MatFormFieldAppearance = 'outline';
}
