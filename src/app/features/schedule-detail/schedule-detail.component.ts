import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input, signal
} from '@angular/core';
import { SchedulesService } from "../../shared/services/schedules.service";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { first, of, switchMap } from "rxjs";
import { MatButton } from "@angular/material/button";
import { Router, RouterLink } from "@angular/router";
import { MatIcon } from "@angular/material/icon";
import { appRoutes } from "../../app.routes";
import { MatDialog } from "@angular/material/dialog";
import {
  ScheduleClassFormDialogComponent, ScheduleClassFormDialogContract
} from "../../shared/dialogs/schedule-class-form-dialog/schedule-class-form-dialog.component";
import {
  ReadScheduleClass,
  ScheduleClass
} from "../../shared/interfaces/schedule-class";
import { DatePipe } from "@angular/common";
import {
  ScheduleClassesService
} from "../../shared/services/schedule-classes.service";
import {
  ScheduleClassesListComponent
} from "../../shared/components/schedule-classes-list/schedule-classes-list.component";
import { LoggerService } from "../../shared/services/logger.service";
import {
  ConfirmDialogComponent, ConfirmDialogContract
} from "../../shared/components/confirm-dialog/confirm-dialog.component";
import { ReadSchedule } from "../../shared/interfaces/schedule";
import {
  ScheduleFormDialogComponent, ScheduleFormDialogContract
} from "../../shared/dialogs/schedule-form-dialog/schedule-form-dialog.component";
import {
  SkeletonComponent
} from "../../shared/components/skeleton/skeleton.component";
import {
  ScheduleGridViewComponent
} from "../../shared/components/schedule-grid-view/schedule-grid-view.component";

@Component({
  selector: 'csb-schedule-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatIcon,
    MatButton,
    ScheduleClassesListComponent,
    SkeletonComponent,
    ScheduleGridViewComponent,
  ],
  providers: [DatePipe],
  templateUrl: './schedule-detail.component.html',
  styleUrl: './schedule-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleDetailComponent {
  private schedulesService = inject(SchedulesService);
  private scheduleClassesService = inject(ScheduleClassesService);
  private logger = inject(LoggerService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  protected readonly appRoutes = appRoutes;

  scheduleId = signal<string | null>(null);

  loaded = signal(false);

  schedule = toSignal(
    toObservable(this.scheduleId).pipe(
      switchMap((scheduleId) => {
        this.loaded.set(true);

        return scheduleId ? this.schedulesService.getById$(scheduleId) : of(null);
      }),
    ),
  );

  scheduleClasses = toSignal(
    toObservable(this.scheduleId).pipe(
      switchMap((scheduleId) => {
        return scheduleId ? this.scheduleClassesService.getAll$(scheduleId) : of(null);
      }),
    ),
  );

  @Input()
  set id(scheduleId: string) { this.scheduleId.set(scheduleId); }

  addClass() {
    const dialogRef = this.dialog.open(
      ScheduleClassFormDialogComponent,
      {
        id: 'add-schedule-class-form-dialog',
        width: '100%',
        maxWidth: '600px',
      },
    );

    dialogRef.afterClosed().pipe(first()).forEach(async (scheduleClass?: ScheduleClass) => {
      if (!scheduleClass) return;

      const scheduleId = this.scheduleId();

      if (!scheduleId) return;

      await this.scheduleClassesService.create(scheduleId, scheduleClass);
    });
  }

  editScheduleClass(scheduleClass: ReadScheduleClass) {
    const dialogRef = this.dialog.open(
      ScheduleClassFormDialogComponent,
      {
        id: 'edit-schedule-class-form-dialog',
        width: '100%',
        maxWidth: '600px',
        data: <ScheduleClassFormDialogContract>{ scheduleClass },
      },
    );

    dialogRef.afterClosed().pipe(first()).forEach(async (scheduleClass?: ReadScheduleClass) => {
      if (!scheduleClass) return;

      const scheduleId = this.scheduleId();

      if (!scheduleId) return;

      await this.scheduleClassesService.update(scheduleId, scheduleClass.id, scheduleClass)
        .then(() => this.logger.log('Updated schedule class'));
    });
  }

  async deleteScheduleClass(classId: string) {
    const scheduleId = this.scheduleId();

    if (!scheduleId) return;

    const dialogRef = this.dialog.open(
      ConfirmDialogComponent,
      {
        id: 'confirm-delete-schedule-class-dialog',
        data: <ConfirmDialogContract>{
          title: 'Are you sure you want to delete this class?'
        },
      },
    );

    dialogRef.afterClosed().pipe(first()).forEach(async (confirm: boolean) => {
      if (!confirm) return;

      await this.scheduleClassesService.delete(scheduleId, classId)
        .then((success) => {
          if (success) this.logger.log('Deleted schedule class');
        });
    });
  }

  deleteSchedule() {
    const scheduleId = this.scheduleId();

    if (!scheduleId) return;

    const dialogRef = this.dialog.open(
      ConfirmDialogComponent,
      {
        id: 'confirm-delete-schedule-dialog',
        data: <ConfirmDialogContract>{
          title: 'Are you sure you want to delete this schedule?',
        },
      },
    );

    dialogRef.afterClosed().pipe(first()).forEach(async (confirm: boolean) => {
      if (!confirm) return;

      await this.schedulesService.delete(scheduleId)
        .then((success) => {
          if (!success) return;

          this.logger.log('Deleted schedule');

          this.router.navigate([appRoutes.schedules]);
        });
    });
  }

  editSchedule(schedule?: ReadSchedule | null) {
    if (!schedule) return;

    const dialogRef = this.dialog.open(
      ScheduleFormDialogComponent,
      {
        id: 'edit-schedule-form-dialog',
        width: '100%',
        maxWidth: '600px',
        data: <ScheduleFormDialogContract>{ schedule },
      },
    );

    dialogRef.afterClosed().pipe(first()).forEach(async (schedule?: ReadSchedule) => {
      if (!schedule) return;

      const scheduleId = this.scheduleId();

      if (!scheduleId) return;

      await this.schedulesService.update(scheduleId, schedule)
        .then(() => this.logger.log('Updated schedule'));
    });
  }
}
