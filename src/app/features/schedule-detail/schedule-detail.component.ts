import {
  ChangeDetectionStrategy,
  Component, computed, effect,
  inject, Input, signal,
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
  ReadScheduleCourse,
} from "../../shared/interfaces/schedule-course";
import { DatePipe, DOCUMENT } from "@angular/common";
import {
  ScheduleCoursesService
} from "../../shared/services/schedule-courses.service";
import {
  ScheduleCoursesListComponent
} from "../../shared/components/schedule-classes-list/schedule-courses-list.component";
import { LoggerService } from "../../shared/services/logger.service";
import {
  ConfirmDialogComponent, ConfirmDialogContract
} from "../../shared/components/confirm-dialog/confirm-dialog.component";
import { ReadSchedule } from "../../shared/interfaces/schedule";
import {
  SkeletonComponent
} from "../../shared/components/skeleton/skeleton.component";
import {
  ScheduleGridViewComponent
} from "../../shared/components/schedule-grid-view/schedule-grid-view.component";
import { DateAgoPipe } from "../../shared/pipes/date-ago.pipe";
import { MatChip, MatChipSet } from "@angular/material/chips";
import { ColorToClassPipe } from "../../shared/pipes/color-to-class.pipe";
import { MatTooltip } from "@angular/material/tooltip";
import { scrollToElementId } from '../../shared/utils/scroll-to-element';

@Component({
  selector: 'csb-schedule-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatIcon,
    MatButton,
    ScheduleCoursesListComponent,
    SkeletonComponent,
    ScheduleGridViewComponent,
    DateAgoPipe,
    DatePipe,
    MatChipSet,
    MatChip,
    ColorToClassPipe,
    MatTooltip,
  ],
  providers: [DatePipe],
  templateUrl: './schedule-detail.component.html',
  styleUrl: './schedule-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleDetailComponent {
  private schedulesService = inject(SchedulesService);
  private scheduleCoursesService = inject(ScheduleCoursesService);
  private logger = inject(LoggerService);
  private dialog = inject(MatDialog);
  private document = inject(DOCUMENT);
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

  scheduleCourses = toSignal(
    toObservable(this.scheduleId).pipe(
      switchMap((scheduleId) => {
        return scheduleId ? this.scheduleCoursesService.getAll$(scheduleId) : of(null);
      }),
    ),
  );

  scheduleCoursesEffect = effect(() => {
    const courseIds = this.scheduleCourses()?.map((c) => c.id);

    return this.shownCourses.set(courseIds || []);
  }, { allowSignalWrites: true });

  shownCourses = signal<string[]>([]);

  scheduleCoursesCredits = computed(() => {
    return this.scheduleCourses()
      ?.reduce((acc, c) => acc + (c.credits || 0), 0);
  });

  @Input()
  set id(scheduleId: string) { this.scheduleId.set(scheduleId); }

  addCourse() {
    const scheduleId = this.scheduleId();

    if (!scheduleId) return;

    this.scheduleCoursesService.openAddScheduleCourseDialog(scheduleId);
  }

  editScheduleCourse(scheduleCourse: ReadScheduleCourse) {
    const scheduleId = this.scheduleId();

    if (!scheduleId) return;

    this.scheduleCoursesService.openEditScheduleCourseDialog(scheduleId, scheduleCourse);
  }

  async deleteScheduleCourse(courseId: string) {
    const scheduleId = this.scheduleId();

    if (!scheduleId) return;

    const dialogRef = this.dialog.open(
      ConfirmDialogComponent,
      {
        id: 'confirm-delete-schedule-course-dialog',
        data: {
          title: 'Are you sure you want to delete this course?'
        } as ConfirmDialogContract,
      },
    );

    dialogRef.afterClosed().pipe(first()).forEach(async (confirm: boolean) => {
      if (!confirm) return;

      await this.scheduleCoursesService.delete(scheduleId, courseId)
        .then((success) => {
          if (success) this.logger.log('Deleted schedule course');
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
        data: {
          title: 'Are you sure you want to delete this schedule?',
        } as ConfirmDialogContract,
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

    this.schedulesService.openEditDialog(schedule);
  }

  scrollToElementId = (elementId: string) =>
    scrollToElementId(elementId, this.document);
}
