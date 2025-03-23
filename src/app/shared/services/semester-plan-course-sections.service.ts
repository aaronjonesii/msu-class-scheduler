import { inject, Injectable } from '@angular/core';
import { FirestoreService } from "./firestore.service";
import { LoggerService } from "./logger.service";
import { MatDialog } from "@angular/material/dialog";
import { CourseSection, ReadCourseSection, WriteCourseSection } from "../interfaces/course-section";
import { catchError, EMPTY } from "rxjs";
import {
  SemesterPlanCourseSectionFormDialogComponent, SemesterPlanCourseSectionFormDialogContract
} from "../dialogs/semester-plan-course-section-form-dialog/semester-plan-course-section-form-dialog.component";
import {
  ConfirmDialogComponent,
  ConfirmDialogContract
} from "../components/confirm-dialog/confirm-dialog.component";

@Injectable({
  providedIn: 'root'
})
export class SemesterPlanCourseSectionsService {
  private db = inject(FirestoreService);
  private logger = inject(LoggerService);
  private dialog = inject(MatDialog);

  private readonly semesterPlansCollectionName = 'semester-plans';
  private readonly coursesCollectionName = (semesterPlanId: string) =>
    `${this.semesterPlansCollectionName}/${semesterPlanId}/courses`;
  private readonly sectionsCollectionName = (semesterPlanId: string, courseId: string) =>
    `${this.coursesCollectionName(semesterPlanId)}/${courseId}/sections`;

  getAll$(semesterPlanId: string, courseId: string) {
    return this.db.col$<ReadCourseSection>(
      this.sectionsCollectionName(semesterPlanId, courseId),
      { idField: 'id' },
    ).pipe(
      catchError((error: unknown) => {
        this.logger.error(
          `Error getting sections for course, ${courseId}, of semester plan: ${semesterPlanId}`,
          error,
        );

        return EMPTY;
      }),
    );
  }

  getById$(semesterPlanId: string, courseId: string, sectionId: string) {
    return this.db.doc$<ReadCourseSection>(
      `${this.sectionsCollectionName(semesterPlanId, courseId)}/${sectionId}`,
    ).pipe(
      catchError((error: unknown) => {
        this.logger.error(
          `Error getting section, ${sectionId}, for course, ${courseId}, of semester plan: ${semesterPlanId}`,
          error,
        );

        return EMPTY;
      }),
    );
  }

  async create(semesterPlanId: string, courseId: string, section: WriteCourseSection) {
    delete section.id;

    return this.db.add<WriteCourseSection>(
      this.sectionsCollectionName(semesterPlanId, courseId),
      section,
    ).catch((error: unknown) => {
      this.logger.error(
        `Error creating section for course, ${courseId}, of semester plan: ${semesterPlanId}`,
        error,
      );

      return null;
    });
  }

  async update(
    semesterPlanId: string,
    courseId: string,
    sectionId: string,
    semesterPlanCourseSection: Partial<WriteCourseSection>,
  ) {
    return this.db.batch(async (batch) => {
      // Update 'updated' property on semester plan document
      const semesterPlanRef = this.db.doc(`${this.semesterPlansCollectionName}/${semesterPlanId}`);
      batch.update(semesterPlanRef, 'updated', this.db.timestamp);

      // Update 'updated' property on course document
      const courseRef = this.db.doc(`${this.coursesCollectionName(semesterPlanId)}/${courseId}`);
      batch.update(courseRef, 'updated', this.db.timestamp);

      const sectionRef = this.db.doc(
        `${this.sectionsCollectionName(semesterPlanId, courseId)}/${sectionId}`,
      );

      batch.update(
        sectionRef,
        { ...semesterPlanCourseSection, updated: this.db.timestamp },
      );
    }).catch((error: unknown) => {
      this.logger.error(
        `Error updating section, ${sectionId}, for course, ${courseId}, of semester plan: ${semesterPlanId}`,
        error,
      );
    });
  }

  async delete(semesterPlanId: string, courseId: string, sectionId: string) {
    return this.db.delete(
      `${this.sectionsCollectionName(semesterPlanId, courseId)}/${sectionId}`,
    ).catch((error: unknown) => {
      this.logger.error(
        `Error deleting section, ${sectionId}, for course, ${courseId}, of semester plan: ${semesterPlanId}`,
        error,
      );
    });
  }

  openAddSectionDialog(semesterPlanId: string, courseId: string) {
    const dialogRef = this.dialog.open(
      SemesterPlanCourseSectionFormDialogComponent,
      {
        id: 'add-semester-plan-course-section-dialog',
        width: '100%',
        maxWidth: '600px'
      }
    );

    dialogRef.afterClosed().forEach(async (section?: CourseSection) => {
      if (!section) return

      await this.create(semesterPlanId, courseId, section);
    });
  }

  openEditSectionDialog(semesterPlanId: string, courseId: string, section: ReadCourseSection) {
    const dialogRef = this.dialog.open(
      SemesterPlanCourseSectionFormDialogComponent,
      {
        id: 'edit-semester-plan-course-section-dialog',
        width: '100%',
        maxWidth: '600px',
        data: { section } satisfies SemesterPlanCourseSectionFormDialogContract
      }
    );

    dialogRef.afterClosed().forEach(async (updatedSection?: CourseSection) => {
      if (!updatedSection) return;

      await this.update(semesterPlanId, courseId, section.id, updatedSection);
    });
  }

  openDeleteSectionDialog(semesterPlanId: string, courseId: string, sectionId: string) {
    const dialogRef = this.dialog.open(
      ConfirmDialogComponent,
      {
        id: 'confirm-delete-semester-plan-course-section-dialog',
        data: {
          title: 'Are you sure you want to delete this course?',
        } satisfies ConfirmDialogContract
      }
    );

    dialogRef.afterClosed().forEach(async (confirmed: boolean) => {
      if (!confirmed) return;

      await this.delete(semesterPlanId, courseId, sectionId)
        .then(() => this.logger.info('Section deleted successfully'));
    });
  }
}
