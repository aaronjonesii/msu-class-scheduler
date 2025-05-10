import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CourseStatus } from '../../enums/course-status';
import { Color } from '../../enums/color';
import { CourseForm } from '../../forms/course-form';
import { MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { KeyValuePipe } from '@angular/common';
import { MatOption, MatSelect, MatSelectTrigger } from '@angular/material/select';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatListItemIcon } from '@angular/material/list';
import { ColorToClassPipe } from '../../pipes/color-to-class.pipe';
import { provideNativeDateAdapter } from "@angular/material/core";

@Component({
  selector: 'csb-course-form',
  templateUrl: './course-form.component.html',
  styleUrl: './course-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule, MatFormFieldModule,
    MatInput, MatDatepickerModule, MatSelect,
    KeyValuePipe, MatOption, MatIcon, MatListItemIcon,
    MatSelectTrigger, ColorToClassPipe, MatCheckbox,
  ],
})
export class CourseFormComponent {
  protected readonly CourseStatus = CourseStatus;
  protected readonly Color = Color;

  courseForm = input<CourseForm>(new CourseForm());

  formAppearance: MatFormFieldAppearance = 'outline';
}
