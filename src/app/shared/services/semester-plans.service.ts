import { inject, Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { LoggerService } from './logger.service';
import { catchError, combineLatest, EMPTY, first, from, map, mergeMap, Observable, of, switchMap, take, toArray } from 'rxjs';
import { ReadSemesterPlan, ReadSemesterPlanWithCourses, SemesterPlan, WriteSemesterPlan } from '../interfaces/semester-plan';
import { where } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { SemesterPlanFormDialogComponent, SemesterPlanFormDialogContract } from '../dialogs/semester-plan-form-dialog/semester-plan-form-dialog.component';
import { appRoutes } from '../../app.routes';
import { Router } from '@angular/router';
import { SemesterTerm } from "../enums/semester-term";
import { FirestorePaths } from "../../firestore.routes";
import { ReadCourse } from "../interfaces/course";

@Injectable({ providedIn: 'root' })
export class SemesterPlansService {
  private db = inject(FirestoreService);
  private logger = inject(LoggerService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  private readonly semesterPlansCollectionName = FirestorePaths.semesterPlans;

  getByUser$(userId: string): Observable<ReadSemesterPlan[]> {
    return this.db.colQuery$<ReadSemesterPlan>(
      this.semesterPlansCollectionName,
      { idField: 'id' },
      where('userId', '==', userId),
    ).pipe(
      catchError((error: unknown) => {
        this.logger.error('Error getting user semester plans', error);

        return EMPTY;
      }),
    );
  }

  getByUserWithClasses$(userId: string): Observable<ReadSemesterPlanWithCourses[]> {
    return this.getByUser$(userId).pipe(
      switchMap((semesterPlans: ReadSemesterPlan[]) => {
        return from(semesterPlans).pipe(
          mergeMap((s) => this.getSemesterPlanWithClasses$(s)),
          take(semesterPlans.length),
          toArray(),
        );
      }),
    );
  }

  getSemesterPlanWithClasses$(semesterPlan: ReadSemesterPlan): Observable<ReadSemesterPlanWithCourses> {
    return of(semesterPlan).pipe(
      switchMap((s) => {
        return combineLatest([of(s), this.getSemesterPlanClasses$(s.id)]).pipe(
          map(([semesterPlan, semesterPlanClasses]) => {
            return { ...semesterPlan, courses: semesterPlanClasses };
          }),
        );
      }),
    );
  }

  getSemesterPlanClasses$(semseterPlanId: string) {
    return this.db.col$<ReadCourse>(
      `${this.semesterPlansCollectionName}/${semseterPlanId}/courses`,
      { idField: 'id' },
    ).pipe(
      catchError((error: unknown) => {
        this.logger.error(
          `Error getting classes for semester plan: ${semseterPlanId}`,
          error,
        );

        return EMPTY;
      }),
    );
  }

  getById$(id: string) {
    return this.db.doc$<ReadSemesterPlan>(`${this.semesterPlansCollectionName}/${id}`).pipe(
      map((semesterPlan) => semesterPlan ? { ...semesterPlan, id } : semesterPlan),
      catchError((error: unknown) => {
        this.logger.error(`Error getting semester plan by id: ${id}`, error);

        return EMPTY;
      }),
    );
  }

  async create(semesterPlan: SemesterPlan) {
    delete semesterPlan.id;

    return this.db.add<SemesterPlan>(this.semesterPlansCollectionName, semesterPlan)
      .catch((error: unknown) => {
        this.logger.error('Error creating semester plan', error);

        return null;
      });
  }

  async update(id: string, semesterPlan: Partial<SemesterPlan>) {
    return this.db.update<WriteSemesterPlan>(`${this.semesterPlansCollectionName}/${id}`, semesterPlan)
      .catch((error: unknown) => {
        this.logger.error(`Error updating semester plan: ${id}`, error);
      });
  }

  async delete(id: string) {
    return this.db.batch(async (batch) => {
      const semesterPlanRef = this.db.doc<SemesterPlan>(`${this.semesterPlansCollectionName}/${id}`);

      batch.delete(semesterPlanRef);

      const semesterPlanClassesQuery =
        await this.db.colSnap(`${this.semesterPlansCollectionName}/${id}/courses`);

      if (!semesterPlanClassesQuery.empty) {
        semesterPlanClassesQuery.docs.map((d) => batch.delete(d.ref));
      }
    }).then(() => true)
      .catch((error: unknown) => {
        this.logger.error(`Error deleting semester plan: ${id}`, error);

        return false;
      });
  }

  async openCreateDialog(userId: string) {
    const dialogRef = this.dialog.open(
      SemesterPlanFormDialogComponent,
      {
        id: 'create-semester-plan-form-dialog',
        width: '100%',
        maxWidth: '600px',
        data: { userId } as SemesterPlanFormDialogContract,
      },
    );

    dialogRef.afterClosed().pipe(first())
      .forEach(async (semesterPlan?: ReadSemesterPlan) => {
        if (!semesterPlan) return;

        await this.create(semesterPlan)
          .then((newDoc) => {
            if (!newDoc) return;

            this.router.navigate([appRoutes.semesterPlanDetail(newDoc.id)]);
          });
      });
  }

  openEditDialog(semesterPlan: ReadSemesterPlan) {
    const dialogRef = this.dialog.open(
      SemesterPlanFormDialogComponent,
      {
        id: 'edit-semester-plan-form-dialog',
        width: '100%',
        maxWidth: '600px',
        data: { semesterPlan } as SemesterPlanFormDialogContract,
      },
    );

    dialogRef.afterClosed().pipe(first())
      .forEach(async (semesterPlan?: ReadSemesterPlan) => {
        if (!semesterPlan) return;

        await this.update(semesterPlan.id, semesterPlan)
          .then(() => this.logger.log('Updated semester plan'));
      });
  }

  getFormattedTermYear(term: SemesterTerm, year: number): string {
    const paddedYear = year.toString().padStart(4, '0');
    const lastTwoDigitsOfYear = paddedYear.slice(-2);

    let termAbbreviation = '';
    switch (term) {
      case SemesterTerm.FALL:
        termAbbreviation = 'FS'
        break;
      case SemesterTerm.SPRING:
        termAbbreviation = 'SS'
        break;
      case SemesterTerm.SUMMER:
        termAbbreviation = 'SU'
        break;
    }

    return `${termAbbreviation}${lastTwoDigitsOfYear}`;
  }

  formatSemesterPlanName = (semesterPlan: SemesterPlan): string => {

    return `${this.getFormattedTermYear(semesterPlan.term, semesterPlan.year)} - ${semesterPlan.name ?? 'Unnamed'}`
  }
}
