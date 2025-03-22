import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CourseSectionForm } from "../../forms/course-section-form";
import { FormArray, FormGroup, ReactiveFormsModule } from "@angular/forms";
import {
  ScheduleClassMeetingsFormComponent
} from "./components/schedule-class-meetings-form/schedule-class-meetings-form.component";
import { ScheduleClassMeetingFormGroup } from "../../interfaces/schedule-class-meeting-form";
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
import { JsonPipe } from "@angular/common";

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
    MatInput,
    JsonPipe
  ],
  templateUrl: './course-section-form.component.html',
  styleUrl: './course-section-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseSectionFormComponent {
  sectionForm = input<CourseSectionForm>(new CourseSectionForm());

  meetingsFormArray = this.sectionForm().meetingsFormArray as unknown as FormArray<FormGroup<ScheduleClassMeetingFormGroup>>

  formAppearance: MatFormFieldAppearance = 'outline';
}
