import { inject, Injectable } from '@angular/core';
import {
  ReadScheduleClass,
  ScheduleClass,
  WriteScheduleClass
} from "../interfaces/schedule-class";
import { FirestoreService } from "./firestore.service";
import { LoggerService } from "./logger.service";
import { catchError, EMPTY } from "rxjs";

@Injectable({ providedIn: 'root' })
export class ScheduleClassesService {
  private db = inject(FirestoreService);
  private logger = inject(LoggerService);

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
    return this.db.update<WriteScheduleClass>(
      `${this.classesCollectionName(scheduleId)}/${classId}`,
      scheduleClass,
    ).catch((error: unknown) => {
      this.logger.error(
        `Error updating class, ${classId}, for schedule: ${scheduleId}`,
        error,
      );
    });
  }

  async delete(scheduleId: string, classId: string) {
    return this.db.delete(
      `${this.classesCollectionName(scheduleId)}/${classId}`,
    ).catch((error: unknown) => {
      this.logger.error(
        `Error deleting class, ${classId}, for schedule: ${scheduleId}`,
        error,
      );

      return error;
    });
  }
}
