import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SemesterPlanForm } from '../../forms/semester-plan-form';
import { MatFormField, MatFormFieldAppearance, MatLabel } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInput } from '@angular/material/input';

@Component({
  selector: 'csb-semester-plan-form',
  templateUrl: './semester-plan-form.component.html',
  styleUrl: './semester-plan-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatLabel
  ],
})
export class SemesterPlanFormComponent {
  semesterPlanForm = input<SemesterPlanForm>(new SemesterPlanForm());

  formAppearance: MatFormFieldAppearance = 'outline';
}
