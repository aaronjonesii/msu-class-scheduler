import { inject, Injectable } from '@angular/core';
import { FirestoreService } from "./firestore.service";
import { where } from "@angular/fire/firestore";
import { LoggerService } from "./logger.service";
import {
  catchError, combineLatest,
  EMPTY, first, from,
  map,
  mergeMap,
  Observable,
  of,
  switchMap, take, toArray
} from "rxjs";
import {
  ReadSchedule,
  ReadScheduleWithClasses,
  Schedule,
  WriteSchedule
} from "../interfaces/schedule";
import { ReadScheduleClass } from "../interfaces/schedule-class";
import {
  ScheduleFormDialogComponent,
  ScheduleFormDialogContract
} from "../dialogs/schedule-form-dialog/schedule-form-dialog.component";
import { MatDialog } from "@angular/material/dialog";

@Injectable({ providedIn: 'root' })
export class SchedulesService {
  private db = inject(FirestoreService);
  private logger = inject(LoggerService);
  private dialog = inject(MatDialog);

  private readonly collectionName = 'schedules';

  get timestamp() {
    return this.db.timestamp;
  }

  getByUser$(userId: string): Observable<ReadSchedule[]> {
    return this.db.colQuery$<ReadSchedule>(
      this.collectionName,
      {idField: 'id'},
      where('userId', '==', userId),
    ).pipe(
      catchError((error: unknown) => {
        this.logger.error('Error getting user schedules', error);

        return EMPTY;
      }),
    );
  }

  getByUserWithClasses$(userId: string): Observable<ReadScheduleWithClasses[]> {
    return this.getByUser$(userId).pipe(
      switchMap((schedules: ReadSchedule[]) => {
        return from(schedules).pipe(
          mergeMap((s) => this.getScheduleWithClasses$(s)),
          take(schedules.length),
          toArray(),
        );
      }),
    );
  }

  getScheduleWithClasses$(schedule: ReadSchedule): Observable<ReadScheduleWithClasses> {
    return of(schedule).pipe(
      switchMap((s) => {
        return combineLatest([of(s), this.getScheduleClasses$(s.id)]).pipe(
          map(([schedule, scheduleClasses]) => {
            return {...schedule, classes: scheduleClasses};
          }),
        );
      }),
    );
  }

  getScheduleClasses$(scheduleId: string) {
    return this.db.col$<ReadScheduleClass>(
      `${this.collectionName}/${scheduleId}/classes`,
      { idField: 'id' },
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

  getById$(id: string) {
    return this.db.doc$<ReadSchedule>(`${this.collectionName}/${id}`).pipe(
      map((schedule) => schedule ? {...schedule, id} : schedule),
      catchError((error: unknown) => {
        this.logger.error(`Error getting schedule by id: ${id}`, error);

        return EMPTY;
      }),
    );
  }

  async create(schedule: Schedule) {
    // @ts-ignore
    delete schedule.id;

    return this.db.add<Schedule>(this.collectionName, schedule)
      .catch((error: unknown) => {
        this.logger.error('Error creating schedule', error);

        return null;
      });
  }

  async update(id: string, schedule: Partial<Schedule>) {
    return this.db.update<WriteSchedule>(`${this.collectionName}/${id}`, schedule)
      .catch((error: unknown) => {
        this.logger.error(`Error updating schedule: ${id}`, error);
      });
  }

  async delete(id: string) {
    return this.db.delete<Schedule>(`${this.collectionName}/${id}`)
      .then(() => true)
      .catch((error: unknown) => {
        this.logger.error(`Error deleting schedule: ${id}`, error);

        return false;
      });
  }

  openEditScheduleDialog(schedule: ReadSchedule) {
    const dialogRef = this.dialog.open(
      ScheduleFormDialogComponent,
      {
        id: 'edit-schedule-form-dialog',
        width: '100%',
        maxWidth: '600px',
        data: <ScheduleFormDialogContract>{ schedule },
      },
    );

    dialogRef.afterClosed().pipe(first())
      .forEach(async (schedule?: ReadSchedule) => {
      if (!schedule) return;

      await this.update(schedule.id, schedule)
        .then(() => this.logger.log('Updated schedule'));
    });
  }
}
