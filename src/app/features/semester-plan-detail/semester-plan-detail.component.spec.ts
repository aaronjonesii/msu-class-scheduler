import { ComponentFixture, DeferBlockBehavior, DeferBlockState, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { SemesterPlanDetailComponent } from './semester-plan-detail.component';
import { SemesterTerm } from '../../shared/enums/semester-term';
import { ReadSemesterPlan } from '../../shared/interfaces/semester-plan';
import { LoggerService } from '../../shared/services/logger.service';
import { MsuClassImportService } from '../../shared/services/msu-class-import.service';
import { ScheduleGeneratorService } from '../../shared/services/schedule-generator.service';
import { SemesterPlanCourseSectionsService } from '../../shared/services/semester-plan-course-sections.service';
import { SemesterPlanCoursesService } from '../../shared/services/semester-plan-courses.service';
import { SemesterPlansService } from '../../shared/services/semester-plans.service';
import { MsuClassPage, parseMsuClassPage } from '../../shared/utils/parse-msu-class-page';
import { ECE_203_PAGE } from '../../shared/utils/parse-msu-class-page.fixtures';

const PLAN = {
  id: 'plan', userId: 'user', name: 'Plan', description: null,
  term: SemesterTerm.SPRING, year: 2027,
} as ReadSemesterPlan;

describe('SemesterPlanDetailComponent', () => {
  let component: SemesterPlanDetailComponent;
  let fixture: ComponentFixture<SemesterPlanDetailComponent>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let importService: jasmine.SpyObj<MsuClassImportService>;
  let logger: jasmine.SpyObj<LoggerService>;

  const page = parseMsuClassPage(ECE_203_PAGE).page as MsuClassPage;

  function closeDialogWith(result: unknown) {
    dialog.open.and.returnValue({ afterClosed: () => of(result) } as ReturnType<MatDialog['open']>);
  }

  beforeEach(async () => {
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    importService = jasmine.createSpyObj<MsuClassImportService>('MsuClassImportService', ['importClass']);
    logger = jasmine.createSpyObj<LoggerService>('LoggerService', ['info', 'error']);
    importService.importClass.and.resolveTo({ added: 8, skipped: 1 });

    await TestBed.configureTestingModule({
      imports: [SemesterPlanDetailComponent],
      deferBlockBehavior: DeferBlockBehavior.Manual,
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: MatDialog, useValue: dialog },
        { provide: MsuClassImportService, useValue: importService },
        { provide: LoggerService, useValue: logger },
        { provide: ScheduleGeneratorService, useValue: {} },
        { provide: SemesterPlanCourseSectionsService, useValue: {} },
        { provide: SemesterPlanCoursesService, useValue: { getAll$: () => of([]) } },
        {
          provide: SemesterPlansService,
          useValue: { getById$: () => of(PLAN), formatSemesterPlanName: () => 'SS27 - Plan' },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SemesterPlanDetailComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', PLAN.id);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('importFromMsu', () => {
    it('should give the dialog the term of the plan', async () => {
      closeDialogWith(undefined);

      await component.importFromMsu(PLAN);

      expect(dialog.open.calls.mostRecent().args[1]?.data)
        .toEqual({ term: SemesterTerm.SPRING, year: 2027 });
    });

    it('should open from the Import from MSU button', async () => {
      closeDialogWith(undefined);
      await fixture.whenStable();
      const [details] = await fixture.getDeferBlocks();
      await details.render(DeferBlockState.Complete);

      (fixture.nativeElement as HTMLElement)
        .querySelector<HTMLButtonElement>('#import-msu-class-btn')?.click();

      expect(dialog.open).toHaveBeenCalledTimes(1);
    });

    it('should import the options picked in the dialog', async () => {
      const options = page.options.slice(0, 2);
      closeDialogWith({ page, options });

      await component.importFromMsu(PLAN);

      expect(importService.importClass).toHaveBeenCalledOnceWith(PLAN.id, page, options);
    });

    it('should say how many sections were added and already there', async () => {
      closeDialogWith({ page, options: page.options });

      await component.importFromMsu(PLAN);

      expect(logger.info).toHaveBeenCalledOnceWith('ECE 203: 8 added, 1 already in the plan');
    });

    it('should say nothing more when the import failed', async () => {
      importService.importClass.and.resolveTo(null);
      closeDialogWith({ page, options: page.options });

      await component.importFromMsu(PLAN);

      expect(logger.info).not.toHaveBeenCalled();
    });

    // Escape and the backdrop close with undefined; the Cancel button closes with ''.
    for (const cancelled of [undefined, '']) {
      it(`should import nothing when the dialog closes with ${JSON.stringify(cancelled)}`, async () => {
        closeDialogWith(cancelled);

        await component.importFromMsu(PLAN);

        expect(importService.importClass).not.toHaveBeenCalled();
      });
    }
  });
});
