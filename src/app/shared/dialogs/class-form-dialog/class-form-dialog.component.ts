import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  MatDialogActions, MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from "@angular/material/dialog";
import { MatButton } from "@angular/material/button";
import {
  ClassFormComponent
} from "../../components/class-form/class-form.component";
import { ClassForm } from "../../forms/class-form";

@Component({
  selector: 'csb-class-form-dialog',
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    ClassFormComponent,
    MatDialogClose
  ],
  templateUrl: './class-form-dialog.component.html',
  styleUrl: './class-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassFormDialogComponent {
  scheduleClassForm = signal(new ClassForm());
}
