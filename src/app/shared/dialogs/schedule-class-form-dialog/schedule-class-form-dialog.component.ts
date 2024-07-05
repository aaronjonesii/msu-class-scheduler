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
import { ScheduleClassForm } from "../../forms/schedule-class-form";
import {
  ScheduleClassFormComponent
} from "../../components/schedule-class-form/schedule-class-form.component";
import { ReadScheduleClass } from "../../interfaces/schedule-class";

export interface ScheduleClassFormDialogContract {
  scheduleClass?: ReadScheduleClass,
}

@Component({
  selector: 'csb-schedule-class-form-dialog',
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    ScheduleClassFormComponent,
    MatDialogClose
  ],
  templateUrl: './schedule-class-form-dialog.component.html',
  styleUrl: './schedule-class-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleClassFormDialogComponent implements OnInit {
  private contract = inject<ScheduleClassFormDialogContract>(MAT_DIALOG_DATA);

  scheduleClassForm = signal(new ScheduleClassForm());

  editing = signal(false);

  ngOnInit() {
    if (!this.contract) return;

    this.editing.set(true);

    this.scheduleClassForm.set(
      new ScheduleClassForm(this.contract.scheduleClass),
    );
  }
}
