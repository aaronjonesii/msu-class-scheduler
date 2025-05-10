import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ReadCourseSection } from "../../interfaces/course-section";
import {
  MAT_DIALOG_DATA,
  MatDialogActions, MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from "@angular/material/dialog";
import { CourseSectionForm } from "../../forms/course-section-form";
import { MatButton } from "@angular/material/button";
import {
  CourseSectionFormComponent
} from "../../components/course-section-form/course-section-form.component";

export interface SemesterPlanCourseSectionFormDialogContract {
  section?: ReadCourseSection
}

@Component({
  selector: 'csb-semester-plan-course-section-form-dialog',
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    CourseSectionFormComponent
  ],
  templateUrl: './semester-plan-course-section-form-dialog.component.html',
  styleUrl: './semester-plan-course-section-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SemesterPlanCourseSectionFormDialogComponent implements OnInit {
  private contract = inject<SemesterPlanCourseSectionFormDialogContract>(MAT_DIALOG_DATA);

  sectionForm = signal(new CourseSectionForm())

  editing = signal(false);

  ngOnInit(): void {
    if (!this.contract) return;

    this.editing.set(true);

    this.sectionForm.set(
      new CourseSectionForm(this.contract.section),
    );
  }
}
