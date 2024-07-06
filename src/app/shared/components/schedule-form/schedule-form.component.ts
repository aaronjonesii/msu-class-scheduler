import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ScheduleForm } from "../../forms/schedule-form";
import {
  MatFormField,
  MatFormFieldAppearance, MatLabel
} from "@angular/material/form-field";
import { ReactiveFormsModule } from "@angular/forms";
import { MatInput } from "@angular/material/input";

@Component({
  selector: 'csb-schedule-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatLabel
  ],
  templateUrl: './schedule-form.component.html',
  styleUrl: './schedule-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleFormComponent {
  scheduleForm = input<ScheduleForm>(new ScheduleForm());

  formAppearance: MatFormFieldAppearance = 'outline';
}
