import {
  ChangeDetectionStrategy,
  Component,
  inject, OnInit,
  signal
} from '@angular/core';
import { ReadSchedule } from "../../interfaces/schedule";
import {
  MAT_DIALOG_DATA, MatDialogActions, MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from "@angular/material/dialog";
import { MatButton } from "@angular/material/button";
import { ScheduleForm } from "../../forms/schedule-form";
import {
  ScheduleFormComponent
} from "../../components/schedule-form/schedule-form.component";

export interface ScheduleFormDialogContract {
  schedule?: ReadSchedule,
  userId: string,
}

@Component({
  selector: 'csb-schedule-form-dialog',
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    ScheduleFormComponent
  ],
  templateUrl: './schedule-form-dialog.component.html',
  styleUrl: './schedule-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleFormDialogComponent implements OnInit {
  private contract = inject<ScheduleFormDialogContract>(MAT_DIALOG_DATA);

  scheduleForm = signal(new ScheduleForm());

  editing = signal(false);

  ngOnInit() {
    if (!this.contract) return;

    if (this.contract.userId) {
      this.scheduleForm().userId = this.contract.userId;
    }

    if (!this.contract.schedule) return;

    this.editing.set(true);

    this.scheduleForm.set(new ScheduleForm(this.contract.schedule));
  }
}
