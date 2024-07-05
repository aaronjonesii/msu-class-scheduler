import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import { ReactiveFormsModule } from "@angular/forms";
import { ClassForm } from "../../forms/class-form";
import {
  MatFormField,
  MatFormFieldAppearance, MatLabel
} from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";

@Component({
  selector: 'csb-class-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormField, MatInput, MatLabel],
  templateUrl: './class-form.component.html',
  styleUrl: './class-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassFormComponent {
  classForm = input<ClassForm>(new ClassForm());

  formAppearance: MatFormFieldAppearance = 'outline';
}
