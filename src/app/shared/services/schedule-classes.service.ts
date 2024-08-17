import { inject, Injectable } from '@angular/core';
import {
  ReadScheduleClass,
  WriteScheduleClass
} from "../interfaces/schedule-class";
import { FirestoreService } from "./firestore.service";
import { LoggerService } from "./logger.service";
import { catchError, EMPTY, first } from "rxjs";
import {
  ScheduleClassFormDialogComponent,
  ScheduleClassFormDialogContract
} from "../dialogs/schedule-class-form-dialog/schedule-class-form-dialog.component";
import { MatDialog } from "@angular/material/dialog";

@Injectable({ providedIn: 'root' })
export class ScheduleClassesService {
  private db = inject(FirestoreService);
  private logger = inject(LoggerService);
  private dialog = inject(MatDialog);

  private readonly schedulesCollectionName = 'schedules';
  private readonly classesCollectionName = (scheduleId: string) =>
    `${this.schedulesCollectionName}/${scheduleId}/classes`;

  getAll$(scheduleId: string) {
    return this.db.col$<ReadScheduleClass>(
      this.classesCollectionName(scheduleId),
      {idField: 'id'},
    ).pipe(
      catchError((error: unknown) => {
        this.logger.error(
          `Error getting classes for schedule: ${scheduleId}`,
          error,
        );

        return EMPTY;
      }),
    );
  }

  getById$(scheduleId: string, classId: string) {
    return this.db.doc$<ReadScheduleClass>(
      `${this.classesCollectionName(scheduleId)}/${classId}`,
    ).pipe(
      catchError((error: unknown) => {
        this.logger.error(
          `Error getting class, ${classId}, for schedule: ${scheduleId}`,
          error,
        );

        return EMPTY;
      }),
    );
  }

  async create(scheduleId: string, scheduleClass: WriteScheduleClass) {
    delete scheduleClass.id;

    return this.db.add<WriteScheduleClass>(
      this.classesCollectionName(scheduleId),
      scheduleClass,
    ).catch((error: unknown) => {
        this.logger.error(
          `Error creating class for schedule: ${scheduleId}`,
          error,
        );

        return null;
      })
  }

  async update(
    scheduleId: string,
    classId: string,
    scheduleClass: Partial<WriteScheduleClass>,
  ) {
    return this.db.batch(async (batch) => {
      // Update 'updated' property on schedule document
      const scheduleRef = this.db.doc(`${this.schedulesCollectionName}/${scheduleId}`);

      batch.update(scheduleRef, 'updated', this.db.timestamp);

      // Update schedule class document
      const classRef = this.db.doc(
        `${this.classesCollectionName(scheduleId)}/${classId}`,
      );

      batch.update(
        classRef,
        Object.assign(scheduleClass, {updated: this.db.timestamp}),
      );
    }).catch((error: unknown) => {
      this.logger.error(
        `Error updating class, ${classId}, for schedule: ${scheduleId}`,
        error,
      );
    });;
  }

  async delete(scheduleId: string, classId: string) {
    return this.db.delete(
      `${this.classesCollectionName(scheduleId)}/${classId}`,
    ).then(() => true).catch((error: unknown) => {
      this.logger.error(
        `Error deleting class, ${classId}, for schedule: ${scheduleId}`,
        error,
      );

      return false;
    });
  }

  openEditScheduleDialog(scheduleId: string, scheduleClass: ReadScheduleClass) {
    const dialogRef = this.dialog.open(
      ScheduleClassFormDialogComponent,
      {
        id: 'edit-schedule-class-form-dialog',
        width: '100%',
        maxWidth: '600px',
        data: { scheduleClass } as ScheduleClassFormDialogContract,
      },
    );

    dialogRef.afterClosed().pipe(first())
      .forEach(async (scheduleClass?: ReadScheduleClass) => {
        if (!scheduleClass) return;

        await this.update(scheduleId, scheduleClass.id, scheduleClass)
          .then(() => this.logger.log('Updated schedule class'));
      });
  }
}
