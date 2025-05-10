import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ScheduleCourseFormComponent } from '../../components/schedule-class-form/schedule-course-form.component';
import { CourseForm } from '../../forms/course-form';
import { ReadCourse } from '../../interfaces/course';
import { CourseFormComponent } from '../../components/course-form/course-form.component';

export interface SemesterPlanCourseFormDialogContract {
  course?: ReadCourse,
}

@Component({
  selector: 'csb-semester-plan-course-form-dialog',
  templateUrl: './semester-plan-course-form-dialog.component.html',
  styleUrl: './semester-plan-course-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    ScheduleCourseFormComponent,
    MatDialogClose,
    CourseFormComponent,
  ],
})
export class SemesterPlanCourseFormDialogComponent implements OnInit {
  private contract = inject<SemesterPlanCourseFormDialogContract>(MAT_DIALOG_DATA);

  courseForm = signal(new CourseForm());

  editing = signal(false);

  ngOnInit(): void {
    if (!this.contract) return;

    this.editing.set(true);

    this.courseForm.set(
      new CourseForm(this.contract.course),
    );
  }
}
