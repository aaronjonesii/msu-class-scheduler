import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButton, MatAnchor } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipSet, MatChip } from '@angular/material/chips';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { ColorToClassPipe } from '../../pipes/color-to-class.pipe';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { SemesterPlansService } from '../../services/semester-plans.service';
import { appRoutes } from '../../../app.routes';
import {
  ReadSemesterPlan,
  ReadSemesterPlanWithCourses
} from '../../interfaces/semester-plan';

@Component({
  selector: 'csb-semester-plans-list',
  templateUrl: './semester-plans-list.component.html',
  styleUrl: './semester-plans-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    RouterLink,
    SkeletonComponent,
    MatCardModule,
    MatChipSet,
    MatChip,
    ColorToClassPipe,
    MatButton,
    MatAnchor,
    MatIcon,
    MatTooltip,
  ],
})
export class SemesterPlansListComponent {
  private semesterPlansService = inject(SemesterPlansService);

  protected readonly appRoutes = appRoutes;

  semesterPlans = input<ReadSemesterPlanWithCourses[] | null | undefined>(null);

  filterText = input<string>();

  formatSemesterPlanName = this.semesterPlansService.formatSemesterPlanName;

  editSemesterPlan(semesterPlan: ReadSemesterPlan) {
    this.semesterPlansService.openEditDialog(semesterPlan);
  }

  semesterPlanCredits = (semesterPlan: ReadSemesterPlan) => {
    return semesterPlan.courses?.reduce((acc, c) => acc + (c.credits || 0), 0);
  }
}
