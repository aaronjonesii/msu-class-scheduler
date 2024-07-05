import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import { ReactiveFormsModule } from "@angular/forms";
import { ScheduleClassForm } from "../../forms/schedule-class-form";
import {
  MatFormField,
  MatFormFieldAppearance, MatLabel
} from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";

@Component({
  selector: 'csb-schedule-class-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormField, MatInput, MatLabel],
  templateUrl: './schedule-class-form.component.html',
  styleUrl: './schedule-class-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleClassFormComponent {
  classForm = input<ScheduleClassForm>(new ScheduleClassForm());

  formAppearance: MatFormFieldAppearance = 'outline';
}
