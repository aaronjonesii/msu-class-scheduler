import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CourseSectionForm } from "../../forms/course-section-form";
import { ReactiveFormsModule } from "@angular/forms";
import {
  ScheduleClassMeetingsFormComponent
} from "./components/schedule-class-meetings-form/schedule-class-meetings-form.component";
import {
  MatDatepickerModule,
} from "@angular/material/datepicker";
import {
  MatFormField,
  MatFormFieldAppearance,
  MatLabel,
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
    MatFormField,
    MatLabel,
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
