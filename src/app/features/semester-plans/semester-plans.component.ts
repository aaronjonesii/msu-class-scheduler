import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { ReadSemesterPlan } from '../../shared/interfaces/semester-plan';

@Component({
  selector: 'csb-semester-plans',
  templateUrl: './semester-plans.component.html',
  styleUrl: './semester-plans.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatButton, MatIcon],
})
export class SemesterPlansComponent {
  semesterPlans: ReadSemesterPlan[] = [];
}
