import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { SchedulesService } from "../../shared/services/schedules.service";
import { toSignal } from "@angular/core/rxjs-interop";
import {
  MatListItemLine,
  MatListItemTitle,
  MatNavList
} from "@angular/material/list";
import { MatMenuItem } from "@angular/material/menu";
import { AuthService } from "../../shared/services/auth.service";
import { of, switchMap } from "rxjs";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { Router, RouterLink } from "@angular/router";
import { appRoutes } from "../../app.routes";
import { LoggerService } from "../../shared/services/logger.service";
import { DatePipe } from "@angular/common";
import { WriteSchedule } from "../../shared/interfaces/schedule";

@Component({
  selector: 'csb-schedules',
  standalone: true,
  imports: [
    MatNavList,
    MatMenuItem,
    MatButton,
    MatIcon,
    MatListItemTitle,
    MatListItemLine,
    DatePipe,
    RouterLink
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

  protected readonly appRoutes = appRoutes;
}
