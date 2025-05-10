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
  ReadScheduleWithCourses,
  Schedule,
  WriteSchedule
} from "../interfaces/schedule";
import { ReadScheduleCourse } from "../interfaces/schedule-course";
import {
  ScheduleFormDialogComponent,
  ScheduleFormDialogContract
} from "../dialogs/schedule-form-dialog/schedule-form-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { User } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { appRoutes } from '../../app.routes';
import { FirestorePaths } from "../../firestore.routes";

@Injectable({ providedIn: 'root' })
export class SchedulesService {
  private db = inject(FirestoreService);
  private logger = inject(LoggerService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  private readonly collectionName = FirestorePaths.schedules;
  private readonly coursesCollectionName = (scheduleId: string) => FirestorePaths.scheduleCourses(scheduleId);

  getByUser$(userId: string): Observable<ReadSchedule[]> {
    return this.db.colQuery$<ReadSchedule>(
      this.collectionName,
      { idField: 'id' },
      where('userId', '==', userId),
    ).pipe(
      catchError((error: unknown) => {
        this.logger.error('Error getting user schedules', error);

        return EMPTY;
      }),
    );
  }

  getByUserWithCourses$(userId: string): Observable<ReadScheduleWithCourses[]> {
    return this.getByUser$(userId).pipe(
      switchMap((schedules: ReadSchedule[]) => {
        return from(schedules).pipe(
          mergeMap((s) => this.getScheduleWithCourses$(s)),
          take(schedules.length),
          toArray(),
        );
      }),
    );
  }

  getScheduleWithCourses$(schedule: ReadSchedule): Observable<ReadScheduleWithCourses> {
    return of(schedule).pipe(
      switchMap((s) => {
        return combineLatest([of(s), this.getScheduleCourses$(s.id)]).pipe(
          map(([schedule, scheduleCourses]) => {
            return { ...schedule, courses: scheduleCourses };
          }),
        );
      }),
    );
  }

  getScheduleCourses$(scheduleId: string) {
    return this.db.col$<ReadScheduleCourse>(
      this.coursesCollectionName(scheduleId),
      { idField: 'id' },
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

  getById$(id: string) {
    return this.db.doc$<ReadSchedule>(`${this.collectionName}/${id}`).pipe(
      map((schedule) => schedule ? { ...schedule, id } : schedule),
      catchError((error: unknown) => {
        this.logger.error(`Error getting schedule by id: ${id}`, error);

        return EMPTY;
      }),
    );
  }

  async create(schedule: Schedule) {
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
    return this.db.batch(async (batch) => {
      const scheduleRef = this.db.doc<Schedule>(`${this.collectionName}/${id}`);

      batch.delete(scheduleRef);

      const scheduleCoursesQuery =
        await this.db.colSnap(this.coursesCollectionName(id));

      if (!scheduleCoursesQuery.empty) {
        scheduleCoursesQuery.docs.map((d) => batch.delete(d.ref));
      }
    }).then(() => true)
      .catch((error: unknown) => {
        this.logger.error(`Error deleting schedule: ${id}`, error);

        return false;
      });
  }

  async openCreateDialog(user: User) {
    const dialogRef = this.dialog.open(
      ScheduleFormDialogComponent,
      {
        id: 'create-schedule-form-dialog',
        width: '100%',
        maxWidth: '600px',
        data: { userId: user.uid } as ScheduleFormDialogContract,
      },
    );

    dialogRef.afterClosed().pipe(first())
      .forEach(async (schedule?: ReadSchedule) => {
        if (!schedule) return;

        await this.create(schedule)
          .then((newDoc) => {
            if (!newDoc) return;

            this.router.navigate([appRoutes.scheduleDetail(newDoc.id)]);
          });
      });
  }

  openEditDialog(schedule: ReadSchedule) {
    const dialogRef = this.dialog.open(
      ScheduleFormDialogComponent,
      {
        id: 'edit-schedule-form-dialog',
        width: '100%',
        maxWidth: '600px',
        data: { schedule } as ScheduleFormDialogContract,
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
