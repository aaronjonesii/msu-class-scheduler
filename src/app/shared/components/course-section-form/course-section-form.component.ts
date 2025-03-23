import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CourseSectionForm } from "../../forms/course-section-form";
import { ReactiveFormsModule } from "@angular/forms";
import {
  ScheduleClassMeetingsFormComponent
} from "./components/schedule-class-meetings-form/schedule-class-meetings-form.component";
import {
  MatDatepickerModule,
  MatDatepickerToggle,
  MatDateRangeInput,
  MatDateRangePicker, MatEndDate, MatStartDate
} from "@angular/material/datepicker";
import {
  MatError,
  MatFormField,
  MatFormFieldAppearance,
  MatHint,
  MatLabel,
  MatSuffix
} from "@angular/material/form-field";
import { provideNativeDateAdapter } from "@angular/material/core";
import { MatInput } from "@angular/material/input";

@Component({
  selector: 'csb-course-section-form',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    ScheduleClassMeetingsFormComponent,
    MatDatepickerModule,
    MatDateRangeInput,
    MatDateRangePicker,
    MatDatepickerToggle,
    MatEndDate,
    MatError,
    MatFormField,
    MatHint,
    MatLabel,
    MatStartDate,
    MatSuffix,
    MatInput
  ],
  templateUrl: './course-section-form.component.html',
  styleUrl: './course-section-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseSectionFormComponent {
  sectionForm = input<CourseSectionForm>(new CourseSectionForm());

  formAppearance: MatFormFieldAppearance = 'outline';
}
