import { inject, Injectable } from '@angular/core';
import { FirestoreService } from "./firestore.service";
import { Schedule } from "../schedule";
import { where } from "@angular/fire/firestore";
import { LoggerService } from "./logger.service";
import { catchError, EMPTY } from "rxjs";

@Injectable({ providedIn: 'root' })
export class SchedulesService {
  private db = inject(FirestoreService);
  private logger = inject(LoggerService);

  private readonly collectionName = 'schedules';

  getByUser$(userId: string) {
    return this.db.colQuery$<Schedule>(
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
    return this.db.doc$<Schedule>(`${this.collectionName}/${id}`).pipe(
      catchError((error: unknown) => {
        this.logger.error(`Error getting schedule by id: ${id}`, error);

        return EMPTY;
      }),
    );
  }

  async create(schedule: Schedule) {
    return this.db.add<Schedule>(this.collectionName, schedule)
      .catch((error: unknown) => {
        this.logger.error('Error creating schedule', error);

        return error;
      });
  }

  async update(id: string, schedule: Partial<Schedule>) {
    return this.db.update<Schedule>(`${this.collectionName}/${id}`, schedule)
      .catch((error: unknown) => {
        this.logger.error(`Error updating schedule: ${id}`, error);

        return error;
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
