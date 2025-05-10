import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SemesterPlanForm } from '../../forms/semester-plan-form';
import { MatFormField, MatFormFieldAppearance, MatLabel } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from "@angular/material/select";
import { SemesterTerm } from "../../enums/semester-term";
import { KeyValuePipe } from "@angular/common";

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
    MatLabel,
    MatSelect,
    MatOption,
    KeyValuePipe
  ],
})
export class SemesterPlanFormComponent {
  semesterPlanForm = input<SemesterPlanForm>(new SemesterPlanForm());

  semesterTerms = SemesterTerm

  formAppearance: MatFormFieldAppearance = 'outline';
}
