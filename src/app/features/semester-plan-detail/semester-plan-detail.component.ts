import { ChangeDetectionStrategy, Component, computed, effect, inject, Input, signal } from '@angular/core';
import { SemesterPlansService } from '../../shared/services/semester-plans.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { first, lastValueFrom, of, switchMap, withLatestFrom } from 'rxjs';
import { ReadSemesterPlan } from '../../shared/interfaces/semester-plan';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { appRoutes } from '../../app.routes';
import { ConfirmDialogComponent, ConfirmDialogContract } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoggerService } from '../../shared/services/logger.service';
import { Router, RouterLink } from '@angular/router';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltip } from '@angular/material/tooltip';
import { ColorToClassPipe } from '../../shared/pipes/color-to-class.pipe';
import { scrollToElementId } from '../../shared/utils/scroll-to-element';
import { DatePipe, DOCUMENT } from '@angular/common';
import { SemesterPlanCoursesService } from '../../shared/services/semester-plan-courses.service';
import { DateAgoPipe } from '../../shared/pipes/date-ago.pipe';
import { MatButton } from '@angular/material/button';
import {
  SemesterPlanCoursesListComponent
} from "../../shared/components/semester-plan-courses-list/semester-plan-courses-list.component";
import { ReadCourse } from "../../shared/interfaces/course";
import {
  SemesterPlanCourseSectionsService
} from "../../shared/services/semester-plan-course-sections.service";
import { ScheduleGeneratorService } from "../../shared/services/schedule-generator.service";

@Component({
  selector: 'csb-semester-plan-detail',
  templateUrl: './semester-plan-detail.component.html',
  styleUrl: './semester-plan-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatIcon, SkeletonComponent, RouterLink,
    MatChipsModule, MatTooltip, ColorToClassPipe,
    DateAgoPipe, DatePipe, MatButton, SemesterPlanCoursesListComponent,
  ],
})
export class SemesterPlanDetailComponent {
  private semesterPlansService = inject(SemesterPlansService);
  private semesterPlanCoursesService = inject(SemesterPlanCoursesService);
  private semesterPlanCourseSectionsService = inject(SemesterPlanCourseSectionsService);
  private scheduleGeneratorService = inject(ScheduleGeneratorService);
  private logger = inject(LoggerService);
  private document = inject(DOCUMENT);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  protected readonly appRoutes = appRoutes;

  semesterPlanId = signal<string | null>(null);

  loaded = signal(false);

  semesterPlan = toSignal(
    toObservable(this.semesterPlanId).pipe(
      switchMap((semesterPlanId) => {
        this.loaded.set(true);

        return semesterPlanId ? this.semesterPlansService.getById$(semesterPlanId) : of(null);
      }),
    ),
  );

  semesterPlanCourses = toSignal(
    toObservable(this.semesterPlanId).pipe(
      switchMap((semesterPlanId) => {
        return semesterPlanId ? this.semesterPlanCoursesService.getAll$(semesterPlanId) : of(null);
      }),
    ),
  );

  scheduleClassesEffect = effect(() => {
    const classIds = this.semesterPlanCourses()?.map((c) => c.id);

    return this.shownCourses.set(classIds || []);
  }, { allowSignalWrites: true });

  shownCourses = signal<string[]>([]);

  scheduleClassesCredits = computed(() => {
    return this.semesterPlanCourses()
      ?.reduce((acc, c) => acc + (c.credits || 0), 0);
  });

  formattedSemesterPlanName = computed(() => {
    const semesterPlan = this.semesterPlan();
    return semesterPlan != null ? this.semesterPlansService.formatSemesterPlanName(semesterPlan) : '';
  });

  @Input()
  set id(semesterPlanId: string) { this.semesterPlanId.set(semesterPlanId); }

  editSemesterPlan(semesterPlan: ReadSemesterPlan) {
    this.semesterPlansService.openEditDialog(semesterPlan);
  }

  deleteSemesterPlan() {
    const semesterPlanId = this.semesterPlanId();

    if (!semesterPlanId) return;

    const dialogRef = this.dialog.open(
      ConfirmDialogComponent,
      {
        id: 'confirm-delete-semester-plan-dialog',
        data: {
          title: 'Are you sure you want to delete this semester plan?',
        } as ConfirmDialogContract,
      },
    );

    dialogRef.afterClosed().pipe(first()).forEach(async (confirm: boolean) => {
      if (!confirm) return;

      await this.semesterPlansService.delete(semesterPlanId)
        .then((success) => {
          if (!success) return;

          this.logger.info('Deleted semester plan');

          this.router.navigate([appRoutes.semesterPlans]);
        });
    });
  }

  addCourse() {
    const semesterPlanId = this.semesterPlanId();

    if (!semesterPlanId) return;

    this.semesterPlanCoursesService.openAddCourseDialog(semesterPlanId);
  }

  editSemesterPlanCourse(course: ReadCourse) {
    const semesterPlanId = this.semesterPlanId();

    if (!semesterPlanId) return;

    this.semesterPlanCoursesService.openEditCourseDialog(semesterPlanId, course);
  }

  deleteSemesterPlanCourse(courseId: string) {
      const semesterPlanId = this.semesterPlanId();

      if (!semesterPlanId) return;

      const dialogRef = this.dialog.open(
        ConfirmDialogComponent,
        {
          id: 'confirm-delete-semester-plan-course-dialog',
          data: {
            title: 'Are you sure you want to delete this course?',
          } satisfies ConfirmDialogContract,
        }
      );

      dialogRef.afterClosed().pipe(first()).forEach(async (confirm: boolean) => {
        if (!confirm) return;

        await this.semesterPlanCoursesService.delete(semesterPlanId, courseId)
          .then((success) => {
            if (success) this.logger.info('Deleted semester plan course');
          });
      })
  }

  addSemesterPlanCourseSection(courseId: string) {
    const semesterPlanId = this.semesterPlanId();

    if (!semesterPlanId) return;

    this.semesterPlanCourseSectionsService.openAddSectionDialog(semesterPlanId, courseId)
  }

  async generateSchedules() {
    const semesterPlanId = this.semesterPlanId();

    if (!semesterPlanId) return;

    await this.scheduleGeneratorService.generateSchedules(semesterPlanId);
  }

  scrollToElementId = (elementId: string) =>
    scrollToElementId(elementId, this.document);
}
