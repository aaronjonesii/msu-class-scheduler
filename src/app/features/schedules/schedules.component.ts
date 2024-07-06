import {
  ChangeDetectionStrategy,
  Component, computed,
  inject, signal,
} from '@angular/core';
import { SchedulesService } from "../../shared/services/schedules.service";
import { toSignal } from "@angular/core/rxjs-interop";
import { AuthService } from "../../shared/services/auth.service";
import { of, switchMap } from "rxjs";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { Router } from "@angular/router";
import { appRoutes } from "../../app.routes";
import { LoggerService } from "../../shared/services/logger.service";
import { WriteSchedule } from "../../shared/interfaces/schedule";
import {
  SchedulesListComponent
} from "../../shared/components/schedules-list/schedules-list.component";
import { MatChipListbox, MatChipOption } from "@angular/material/chips";
import { KeyValuePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Timestamp } from "@angular/fire/firestore";
import { dateDifference } from "../../shared/utils/date-difference";

export enum ScheduleFilterOption {
  MOST_RECENT = 'Most recent',
  ALL = 'All',
}

@Component({
  selector: 'csb-schedules',
  standalone: true,
  imports: [
    MatButton,
    MatIcon,
    SchedulesListComponent,
    MatChipListbox,
    MatChipOption,
    KeyValuePipe,
    FormsModule
  ],
  templateUrl: './schedules.component.html',
  styleUrl: './schedules.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulesComponent {
  private schedulesService = inject(SchedulesService);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);
  private router = inject(Router);

  protected readonly appRoutes = appRoutes;
  protected readonly ScheduleFilterOption = ScheduleFilterOption;

  schedulesFilter = signal(ScheduleFilterOption.MOST_RECENT);

  user = toSignal(this.authService.authState$());

  schedules = toSignal(
    this.authService.authState$().pipe(
      switchMap((user) => {
        return user ? this.schedulesService.getByUserWithClasses$(user.uid) : of([]);
      }),
    ),
  );

  filteredSchedules = computed(() => {
    switch (this.schedulesFilter()) {
      case ScheduleFilterOption.MOST_RECENT:
        return this.schedules()?.filter((s) => {
          const mostRecentDate = (s?.updated || s.created) as Timestamp;

          const now = new Date();

          const differenceInDays = dateDifference(now, mostRecentDate.toDate());

          return differenceInDays <= 30;
        });
      case ScheduleFilterOption.ALL: return this.schedules();
      default: return this.schedules();
    }
  });

  async createSchedule() {
    const user = this.user();

    if (!user) {
      this.logger.error('Error creating schedule, user is undefined.');

      return;
    }

    const schedule: WriteSchedule = {
      name: '',
      description: '',
      userId: user.uid,
      created: this.schedulesService.timestamp,
      classes: [],
    };

    await this.schedulesService.create(schedule)
      .then((newDoc) => {
        if (!newDoc) return;

        this.router.navigate([appRoutes.scheduleDetail(newDoc.id)]);
      });
  }

  keepSameOrder = () => 1;
}
