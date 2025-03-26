import { inject, Injectable } from '@angular/core';
import { LoggerService } from "./logger.service";
import { FirestoreService } from "./firestore.service";
import { ReadCourseSection } from "../interfaces/course-section";
import { ReadSemesterPlan } from "../interfaces/semester-plan";
import { FirestorePaths } from "../../firestore.routes";
import {
  of,
  combineLatest,
  switchMap,
  map,
  from,
  mergeMap,
  Observable,
  take,
  toArray,
  lastValueFrom, first
} from "rxjs";
import {
  ReadCourse,
  ReadCourseWithSections
} from "../interfaces/course";
import { ScheduleCourse, WriteScheduleCourse } from "../interfaces/schedule-course";
import { ScheduleCourseMeeting } from "../interfaces/schedule-course-meeting";
import { ScheduleCourseStatus } from "../enums/schedule-course-status";
import { ScheduleCourseMeetingType } from "../enums/schedule-course-meeting-type";
import {
  ScheduleFormDialogComponent,
  ScheduleFormDialogContract
} from "../dialogs/schedule-form-dialog/schedule-form-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { toSignal } from "@angular/core/rxjs-interop";
import { AuthService } from "./auth.service";
import { ReadSchedule, Schedule } from "../interfaces/schedule";
import { Router } from "@angular/router";
import { appRoutes } from "../../app.routes";

@Injectable({ providedIn: 'root' })
export class ScheduleGeneratorService {
  private db = inject(FirestoreService);
  private logger = inject(LoggerService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  user = toSignal(this.authService.authState$());

  getSemesterPlanWithCourses$(semesterPlanId: string) {
    return this.db.doc$<ReadSemesterPlan>(FirestorePaths.semesterPlan(semesterPlanId)).pipe(
      switchMap(semesterPlan => {
        const semesterPlanCourses = this.db.col$<ReadCourse>(
          FirestorePaths.semesterPlanCourses(semesterPlanId),
          { idField: 'id' }
        ).pipe(
          switchMap(courses => {
            return from(courses).pipe(
              mergeMap(c => this.getCourseWithSections$(semesterPlanId, c)),
              take(courses.length),
              toArray(),
            )
          })
        );
        return combineLatest([of(semesterPlan), semesterPlanCourses]).pipe(
          map(([plan, courses]) => ({ ...plan, courses }))
        );
      })
    );
  }

  getCourseWithSections$(semesterPlanId: string, course: ReadCourse): Observable<ReadCourseWithSections> {
    return of(course).pipe(
      switchMap(c => {
        const courseSections = this.db.col$<ReadCourseSection>(
          FirestorePaths.semesterPlanCourseSections(semesterPlanId, c.id),
          { idField: 'id' }
        );
        return combineLatest([of(c), courseSections]).pipe(
          map(([_course, sections]) => ({ ..._course, sections }))
        )
      })
    );
  }

  async generateSchedule(semesterPlanId: string) {
    const user = this.user();

    if (user == null) return;

    const semesterPlan = await lastValueFrom(this.getSemesterPlanWithCourses$(semesterPlanId).pipe(first()))

    let courseSectionsCount = 0;
    for (const course of semesterPlan.courses) {
      const courseSection = course.sections?.find(s => s.id === course.selectedSectionId);
      if (courseSection != null) courseSectionsCount += 1;
    }

    if (semesterPlan.courses.length < 2 || courseSectionsCount < 2) {
      this.logger.warn('A schedule requires at least 2 courses with selected sections.');
    }

    const dialogRef = this.dialog.open(
      ScheduleFormDialogComponent,
      {
        id: 'generate-schedule-form-dialog',
        width: '100%',
        maxWidth: '600px',
        data: { userId: user.uid } as ScheduleFormDialogContract,
      },
    );

    dialogRef.afterClosed().subscribe(async (schedule?: ReadSchedule) => {
      if (!schedule) return

      await this.createSchedule(schedule)
        .then(newDoc => {
          if (!newDoc) return;
          const scheduleCourses: ScheduleCourse[] = semesterPlan.courses.map(this.courseToScheduleCourse)
          return Promise.all(scheduleCourses.map((scheduleCourse => this.createScheduleCourse(newDoc.id, scheduleCourse))))
            .then(() => this.router.navigate([appRoutes.scheduleDetail(newDoc.id)]))
            .catch(error => this.logger.error('An error occurred while creating schedule courses from semester plan.', error))
        }).catch(error => this.logger.error('An error occurred while creating schedule from semester plan.', error))
    })
  }

  private courseToScheduleCourse(course: ReadCourse): ScheduleCourse {
    const courseSection = course.sections?.find(s => s.id === course.selectedSectionId);
    const courseMeetings = courseSection?.meetings.map(meeting => ({
      type: meeting.type as unknown as ScheduleCourseMeetingType,
      instructor: meeting.instructor,
      meetingTimes: meeting.meetingTimes,
      location: meeting.location
    }));
    const scheduleCourseMeetings: ScheduleCourseMeeting[] = courseMeetings ?? []
    return {
      id: course.id,
      status: course.status as unknown as ScheduleCourseStatus,
      subjectCode: course.subjectCode ?? null,
      courseNumber: course.courseNumber ?? null,
      name: course.name,
      description: course.description ?? null,
      meetings: scheduleCourseMeetings,
      sections: [],
      color: course.color ?? null,
      endDate: course.endDate ?? null,
      credits: course.credits ?? null,
      startDate: course.startDate ?? null,
      term: course.term ?? null,
      notes: course.notes ?? null,
      isNotMSUCourse: course.isNotMSUCourse ?? null,
      created: course.created ?? null,
      updated: course.updated ?? null,
    };
  }

  async createScheduleCourse(scheduleId: string, scheduleCourse: WriteScheduleCourse) {
    delete scheduleCourse.id;

    return this.db.add<WriteScheduleCourse>(
      FirestorePaths.scheduleCourses(scheduleId),
      scheduleCourse,
    ).catch((error: unknown) => {
        this.logger.error(
          `Error creating course for schedule: ${scheduleId}`,
          error,
        );

        return null;
      })
  }

  async createSchedule(schedule: Schedule) {
    delete schedule.id;

    return this.db.add<Schedule>(FirestorePaths.schedules, schedule)
      .catch((error: unknown) => {
        this.logger.error('Error creating schedule', error);

        return null;
      });
  }
}
