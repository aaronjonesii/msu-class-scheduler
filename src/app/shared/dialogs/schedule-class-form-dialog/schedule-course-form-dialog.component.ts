import {
  ChangeDetectionStrategy,
  Component,
  inject, OnInit,
  signal
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions, MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from "@angular/material/dialog";
import { MatButton } from "@angular/material/button";
import { ScheduleCourseForm } from "../../forms/schedule-course-form";
import {
  ScheduleCourseFormComponent
} from "../../components/schedule-class-form/schedule-course-form.component";
import { ReadScheduleCourse } from "../../interfaces/schedule-course";

export interface ScheduleClassFormDialogContract {
  scheduleClass?: ReadScheduleCourse,
}

@Component({
  selector: 'csb-schedule-course-form-dialog',
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    ScheduleCourseFormComponent,
    MatDialogClose
  ],
  templateUrl: './schedule-course-form-dialog.component.html',
  styleUrl: './schedule-course-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleCourseFormDialogComponent implements OnInit {
  private contract = inject<ScheduleClassFormDialogContract>(MAT_DIALOG_DATA);

  scheduleClassForm = signal(new ScheduleCourseForm());

  editing = signal(false);

  ngOnInit() {
    if (!this.contract) return;

    this.editing.set(true);

    this.scheduleClassForm.set(
      new ScheduleCourseForm(this.contract.scheduleClass),
    );
  }
}
