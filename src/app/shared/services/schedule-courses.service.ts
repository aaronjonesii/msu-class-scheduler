import { inject, Injectable } from '@angular/core';
import {
  ReadScheduleCourse, ScheduleCourse,
  WriteScheduleCourse
} from "../interfaces/schedule-course";
import { FirestoreService } from "./firestore.service";
import { LoggerService } from "./logger.service";
import { catchError, EMPTY, first } from "rxjs";
import {
  ScheduleCourseFormDialogComponent,
  ScheduleClassFormDialogContract
} from "../dialogs/schedule-class-form-dialog/schedule-course-form-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { FirestorePaths } from "../../firestore.routes";

@Injectable({ providedIn: 'root' })
export class ScheduleCoursesService {
  private db = inject(FirestoreService);
  private logger = inject(LoggerService);
  private dialog = inject(MatDialog);

  private readonly schedulesCollectionName = FirestorePaths.schedules;
  private readonly coursesCollectionName = (scheduleId: string) =>
    FirestorePaths.scheduleCourses(scheduleId);

  getAll$(scheduleId: string) {
    return this.db.col$<ReadScheduleCourse>(
      this.coursesCollectionName(scheduleId),
      {idField: 'id'},
    ).pipe(
      catchError((error: unknown) => {
        this.logger.error(
          `Error getting courses for schedule: ${scheduleId}`,
          error,
        );

        return EMPTY;
      }),
    );
  }

  getById$(scheduleId: string, courseId: string) {
    return this.db.doc$<ReadScheduleCourse>(
      `${this.coursesCollectionName(scheduleId)}/${courseId}`,
    ).pipe(
      catchError((error: unknown) => {
        this.logger.error(
          `Error getting course, ${courseId}, for schedule: ${scheduleId}`,
          error,
        );

        return EMPTY;
      }),
    );
  }

  async create(scheduleId: string, scheduleCourse: WriteScheduleCourse) {
    delete scheduleCourse.id;

    return this.db.add<WriteScheduleCourse>(
      this.coursesCollectionName(scheduleId),
      scheduleCourse,
    ).catch((error: unknown) => {
        this.logger.error(
          `Error creating course for schedule: ${scheduleId}`,
          error,
        );

        return null;
      })
  }

  async update(
    scheduleId: string,
    courseId: string,
    scheduleCourse: Partial<WriteScheduleCourse>,
  ) {
    return this.db.batch(async (batch) => {
      // Update 'updated' property on schedule document
      const scheduleRef = this.db.doc(`${this.schedulesCollectionName}/${scheduleId}`);

      batch.update(scheduleRef, 'updated', this.db.timestamp);

      // Update schedule course document
      const courseRef = this.db.doc(
        `${this.coursesCollectionName(scheduleId)}/${courseId}`,
      );

      batch.update(
        courseRef,
        Object.assign(scheduleCourse, {updated: this.db.timestamp}),
      );
    }).catch((error: unknown) => {
      this.logger.error(
        `Error updating course, ${courseId}, for schedule: ${scheduleId}`,
        error,
      );
    });
  }

  async delete(scheduleId: string, classId: string) {
    return this.db.delete(
      `${this.coursesCollectionName(scheduleId)}/${classId}`,
    ).then(() => true).catch((error: unknown) => {
      this.logger.error(
        `Error deleting course, ${classId}, for schedule: ${scheduleId}`,
        error,
      );

      return false;
    });
  }

  openAddScheduleCourseDialog(scheduleId: string) {
    const dialogRef = this.dialog.open(
      ScheduleCourseFormDialogComponent,
      {
        id: 'add-schedule-course-form-dialog',
        width: '100%',
        maxWidth: '600px',
      },
    );

    dialogRef.afterClosed().pipe(first()).forEach(async (scheduleCourse?: ScheduleCourse) => {
      if (!scheduleCourse) return;

      await this.create(scheduleId, scheduleCourse);
    });
  }

  openEditScheduleCourseDialog(scheduleId: string, scheduleClass: ReadScheduleCourse) {
    const dialogRef = this.dialog.open(
      ScheduleCourseFormDialogComponent,
      {
        id: 'edit-schedule-course-form-dialog',
        width: '100%',
        maxWidth: '600px',
        data: { scheduleClass } satisfies ScheduleClassFormDialogContract,
      },
    );

    dialogRef.afterClosed().pipe(first())
      .forEach(async (scheduleCourse?: ReadScheduleCourse) => {
        if (!scheduleCourse) return;

        await this.update(scheduleId, scheduleCourse.id, scheduleCourse)
          .then(() => this.logger.info('Updated schedule course'));
      });
  }
}
