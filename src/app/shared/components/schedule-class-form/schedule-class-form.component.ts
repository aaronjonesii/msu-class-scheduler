import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import { ReactiveFormsModule } from "@angular/forms";
import { ScheduleClassForm } from "../../forms/schedule-class-form";
import {
  MatError,
  MatFormField,
  MatFormFieldAppearance, MatFormFieldModule, MatHint, MatLabel
} from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import {
  MatDatepickerModule,
} from "@angular/material/datepicker";
import { MatOption, provideNativeDateAdapter } from "@angular/material/core";
import { MatSelect } from "@angular/material/select";
import { ScheduleClassStatus } from "../../enums/schedule-class-status";
import { KeyValuePipe } from "@angular/common";

@Component({
  selector: 'csb-schedule-class-form',
  standalone: true,
  templateUrl: './schedule-class-form.component.html',
  styleUrl: './schedule-class-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule, MatFormFieldModule,
    MatInput, MatDatepickerModule, MatSelect, KeyValuePipe, MatOption,
  ],
})
export class ScheduleClassFormComponent {
  classForm = input<ScheduleClassForm>(new ScheduleClassForm());

  formAppearance: MatFormFieldAppearance = 'outline';
  protected readonly ScheduleClassStatus = ScheduleClassStatus;
}
