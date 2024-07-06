import {
  ChangeDetectionStrategy,
  Component,
  inject,
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

@Component({
  selector: 'csb-schedules',
  standalone: true,
  imports: [
    MatButton,
    MatIcon,
    SchedulesListComponent
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

  user = toSignal(this.authService.authState$());

  schedules = toSignal(
    this.authService.authState$().pipe(
      switchMap((user) => {
        return user ? this.schedulesService.getByUser$(user.uid) : of([]);
      }),
    ),
  );

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
}
