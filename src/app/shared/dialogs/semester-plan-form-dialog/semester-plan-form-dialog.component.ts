import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ReadSemesterPlan } from '../../interfaces/semester-plan';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { SemesterPlanForm } from '../../forms/semester-plan-form';
import { MatButton } from '@angular/material/button';
import { SemesterPlanFormComponent } from '../../components/semester-plan-form/semester-plan-form.component';

export interface SemesterPlanFormDialogContract {
  semesterPlan?: ReadSemesterPlan,
  userId: string,
}

@Component({
  selector: 'csb-semester-plan-form-dialog',
  templateUrl: './semester-plan-form-dialog.component.html',
  styleUrl: './semester-plan-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    SemesterPlanFormComponent,
  ],
})
export class SemesterPlanFormDialogComponent implements OnInit {
  private contract = inject<SemesterPlanFormDialogContract>(MAT_DIALOG_DATA);

  semesterPlanForm = signal(new SemesterPlanForm());

  editing = signal(false);

  ngOnInit() {
    if (!this.contract) return;

    if (this.contract.userId) {
      this.semesterPlanForm().userId = this.contract.userId;
    }

    if (!this.contract.semesterPlan) return;

    this.editing.set(true);

    this.semesterPlanForm.set(new SemesterPlanForm(this.contract.semesterPlan));
  }
}
