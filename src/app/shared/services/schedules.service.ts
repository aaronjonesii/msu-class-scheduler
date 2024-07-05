import { inject, Injectable } from '@angular/core';
import { FirestoreService } from "./firestore.service";
import { where } from "@angular/fire/firestore";
import { LoggerService } from "./logger.service";
import { catchError, EMPTY, map } from "rxjs";
import { ReadSchedule, Schedule, WriteSchedule } from "../interfaces/schedule";

@Injectable({ providedIn: 'root' })
export class SchedulesService {
  private db = inject(FirestoreService);
  private logger = inject(LoggerService);

  private readonly collectionName = 'schedules';

  get timestamp() {
    return this.db.timestamp;
  }

  getByUser$(userId: string) {
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
      .catch((error: unknown) => {
        this.logger.error(`Error deleting schedule: ${id}`, error);

        return error;
      });
  }
}
