import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FirestoreService } from './firestore.service';
import { LoggerService } from './logger.service';
import { catchError, EMPTY, first } from 'rxjs';
import { Course, ReadCourse, WriteCourse } from '../interfaces/course';
import {
  SemesterPlanCourseFormDialogComponent,
  SemesterPlanCourseFormDialogContract
} from '../dialogs/semester-plan-course-form-dialog/semester-plan-course-form-dialog.component';

@Injectable({ providedIn: 'root' })
export class SemesterPlanCoursesService {
  private db = inject(FirestoreService);
  private logger = inject(LoggerService);
  private dialog = inject(MatDialog);

  private readonly semesterPlansCollectionName = 'semester-plans';
  private readonly coursesCollectionName = (semesterPlanId: string) =>
    `${this.semesterPlansCollectionName}/${semesterPlanId}/courses`;

  getAll$(semesterPlanId: string) {
    return this.db.col$<ReadCourse>(
      this.coursesCollectionName(semesterPlanId),
      { idField: 'id' },
    ).pipe(
      catchError((error: unknown) => {
        this.logger.error(
          `Error getting courses for semester plan: ${semesterPlanId}`,
          error,
        );

        return EMPTY;
      }),
    );
  }

  getAllWithSections$(semesterPlanId: string) {
    return this.getAll$(semesterPlanId).pipe(

    )
  }

  getById$(semesterPlanId: string, courseId: string) {
    return this.db.doc$<ReadCourse>(
      `${this.coursesCollectionName(semesterPlanId)}/${courseId}`,
    ).pipe(
      catchError((error: unknown) => {
        this.logger.error(
          `Error getting course, ${courseId}, for semester plan: ${semesterPlanId}`,
          error,
        );

        return EMPTY;
      }),
    );
  }

  async create(semesterPlanId: string, course: WriteCourse) {
    delete course.id;

    return this.db.add<WriteCourse>(
      this.coursesCollectionName(semesterPlanId),
      course,
    ).catch((error: unknown) => {
      this.logger.error(
        `Error creating course for semester plan: ${semesterPlanId}`,
        error,
      );

      return null;
    })
  }

  async update(
    semesterPlanId: string,
    courseId: string,
    semesterPlanCourse: Partial<WriteCourse>,
  ) {
    return this.db.batch(async (batch) => {
      // Update 'updated' property on semester plan document
      const semesterPlanRef = this.db.doc(`${this.semesterPlansCollectionName}/${semesterPlanId}`);

      batch.update(semesterPlanRef, 'updated', this.db.timestamp);

      // Update semester plan course document
      const classRef = this.db.doc(
        `${this.coursesCollectionName(semesterPlanId)}/${courseId}`,
      );

      batch.update(
        classRef,
        Object.assign(semesterPlanCourse, { updated: this.db.timestamp }),
      );
    }).catch((error: unknown) => {
      this.logger.error(
        `Error updating course, ${courseId}, for semester plan: ${semesterPlanId}`,
        error,
      );
    });
  }

  async delete(semesterPlanId: string, courseId: string) {
    return this.db.delete(
      `${this.coursesCollectionName(semesterPlanId)}/${courseId}`,
    ).then(() => true).catch((error: unknown) => {
      this.logger.error(
        `Error deleting course, ${courseId}, for semester plan: ${semesterPlanId}`,
        error,
      );

      return false;
    });
  };

  openAddCourseDialog(semesterPlanId: string) {
    const dialogRef = this.dialog.open(
      SemesterPlanCourseFormDialogComponent,
      {
        id: 'add-semester-plan-course-form-dialog',
        width: '100%',
        maxWidth: '600px',
      },
    );

    dialogRef.afterClosed().pipe(first()).forEach(async (course?: Course) => {
      if (!course) return;

      await this.create(semesterPlanId, course);
    });
  }

  openEditCourseDialog(semesterPlanId: string, semesterPlanCourse: ReadCourse) {
    const dialogRef = this.dialog.open(
      SemesterPlanCourseFormDialogComponent,
      {
        id: 'edit-semester-plan-course-form-dialog',
        width: '100%',
        maxWidth: '600px',
        data: { course: semesterPlanCourse } satisfies SemesterPlanCourseFormDialogContract,
      }
    );

    dialogRef.afterClosed().pipe(first()).forEach(async (course?: Course) => {
      if (!course) return;

      await this.update(semesterPlanId, semesterPlanCourse.id, course)
        .then(() => this.logger.info('Updated semester plan course'));
    })
  }
}
