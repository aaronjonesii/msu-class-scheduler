import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { SemesterPlansService } from '../../shared/services/semester-plans.service';
import { AuthService } from '../../shared/services/auth.service';
import { LoggerService } from '../../shared/services/logger.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { dateDifference } from '../../shared/utils/date-difference';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { KeyValuePipe } from '@angular/common';
import { SemesterPlansListComponent } from '../../shared/components/semester-plans-list/semester-plans-list.component';

export enum SemesterPlanFilterOption {
  MOST_RECENT = 'Most recent',
  ALL = 'All',
}

@Component({
  selector: 'csb-semester-plans',
  templateUrl: './semester-plans.component.html',
  styleUrl: './semester-plans.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    SemesterPlansListComponent,
    MatButton, MatIcon,
    MatChipListbox,
    MatChipOption,
    FormsModule,
    KeyValuePipe,
  ],
})
export class SemesterPlansComponent {
  private semesterPlansService = inject(SemesterPlansService);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);

  protected readonly SemesterPlanFilterOption = SemesterPlanFilterOption;

  user = toSignal(this.authService.authState$());

  semesterPlans = toSignal(
    this.authService.authState$().pipe(
      switchMap((user) => {
        return user ? this.semesterPlansService.getByUserWithClasses$(user.uid) : of([]);
      }),
    ),
  );

  semesterPlansFilter = signal(SemesterPlanFilterOption.ALL);

  mostRecentDays = 30;

  filterDescription = computed(() => {
    switch (this.semesterPlansFilter()) {
      case SemesterPlanFilterOption.MOST_RECENT:
        return `Your recently updated semester plans (within ${this.mostRecentDays} days).`;
      case SemesterPlanFilterOption.ALL:
      default:
        return 'All your semester plans.';
    }
  })

  filteredSemesterPlans = computed(() => {
    switch (this.semesterPlansFilter()) {
      case SemesterPlanFilterOption.MOST_RECENT:
        return this.semesterPlans()?.filter((sp) => {
          const mostRecentDate = (sp?.updated || sp.created) as Timestamp;

          const now = new Date();

          const differenceInDays = dateDifference(now, mostRecentDate.toDate());

          return differenceInDays <= this.mostRecentDays;
        });
      case SemesterPlanFilterOption.ALL:
      default: return this.semesterPlans();
    }
  });

  createSemesterPlan() {
    const user = this.user();

    if (!user) {
      this.logger.error('Error creating schedule, user is undefined.');

      return;
    }

    this.semesterPlansService.openCreateDialog(user.uid);
  }

  keepSameOrder = () => 1;
}
