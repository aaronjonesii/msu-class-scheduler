import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  MatDialogActions, MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from "@angular/material/dialog";
import { MatButton } from "@angular/material/button";
import { ScheduleClassForm } from "../../forms/schedule-class-form";
import {
  ScheduleClassFormComponent
} from "../../components/schedule-class-form/schedule-class-form.component";

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
export class ScheduleClassFormDialogComponent {
  scheduleClassForm = signal(new ScheduleClassForm());
}
