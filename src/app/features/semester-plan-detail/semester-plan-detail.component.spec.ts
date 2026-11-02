import { ComponentFixture, DeferBlockBehavior, DeferBlockState, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { SemesterPlanDetailComponent } from './semester-plan-detail.component';
import { CourseStatus } from '../../shared/enums/course-status';
import { SemesterTerm } from '../../shared/enums/semester-term';
import { ReadCourse } from '../../shared/interfaces/course';
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
  let generator: jasmine.SpyObj<ScheduleGeneratorService>;
  let plan$: BehaviorSubject<ReadSemesterPlan | null>;
  let courses$: BehaviorSubject<ReadCourse[]>;

  const page = parseMsuClassPage(ECE_203_PAGE).page as MsuClassPage;

  const course = (id: string, changes: Partial<ReadCourse> = {}): ReadCourse => ({
    id, name: id, status: CourseStatus.OPEN, isNotMSUCourse: null, ...changes,
  });
  const element = () => fixture.nativeElement as HTMLElement;
  const buttonWithText = (text: string) => Array.from(element().querySelectorAll('button'))
    .find((button) => button.textContent?.trim() === text);

  async function renderPage() {
    await fixture.whenStable();
    const [details] = await fixture.getDeferBlocks();
    await details.render(DeferBlockState.Complete);
    fixture.detectChanges();
  }

  function closeDialogWith(result: unknown) {
    dialog.open.and.returnValue({ afterClosed: () => of(result) } as ReturnType<MatDialog['open']>);
  }

  beforeEach(async () => {
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    importService = jasmine.createSpyObj<MsuClassImportService>('MsuClassImportService', ['importClass']);
    logger = jasmine.createSpyObj<LoggerService>('LoggerService', ['info', 'error']);
    importService.importClass.and.resolveTo({ added: 8, skipped: 1 });
    generator = jasmine.createSpyObj<ScheduleGeneratorService>('ScheduleGeneratorService', ['generateSchedules']);
    plan$ = new BehaviorSubject<ReadSemesterPlan | null>(PLAN);
    courses$ = new BehaviorSubject<ReadCourse[]>([]);

    await TestBed.configureTestingModule({
      imports: [SemesterPlanDetailComponent],
      deferBlockBehavior: DeferBlockBehavior.Manual,
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: MatDialog, useValue: dialog },
        { provide: MsuClassImportService, useValue: importService },
        { provide: LoggerService, useValue: logger },
        { provide: ScheduleGeneratorService, useValue: generator },
        { provide: SemesterPlanCourseSectionsService, useValue: { getAll$: () => of([]) } },
        { provide: SemesterPlanCoursesService, useValue: { getAll$: () => courses$ } },
        {
          provide: SemesterPlansService,
          useValue: { getById$: () => plan$, formatSemesterPlanName: () => 'SS27 - Plan' },
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

  describe('the top of the page', () => {
    it('should use the name of the plan as the title', async () => {
      await renderPage();

      expect(element().querySelector('h2')?.textContent?.trim()).toBe('SS27 - Plan');
    });

    it('should still have a title when there is no plan to show', async () => {
      plan$.next(null);

      await renderPage();

      expect(element().querySelector('h2')?.textContent?.trim()).toBe('Semester Plan');
    });

    it('should show the description of the plan', async () => {
      plan$.next({ ...PLAN, description: 'My first choice' });

      await renderPage();

      expect(element().querySelector('.description')?.textContent).toContain('My first choice');
    });

    it('should leave out an empty description', async () => {
      await renderPage();

      expect(element().querySelector('.description')).toBeNull();
    });

    it('should have no block of details above the courses', async () => {
      await renderPage();

      expect(element().querySelector('.details')).toBeNull();
    });

    it('should offer Generate Schedules once there are courses', async () => {
      courses$.next([course('math')]);

      await renderPage();

      buttonWithText('Generate Schedules')?.click();

      expect(generator.generateSchedules).toHaveBeenCalledOnceWith(PLAN.id);
    });

    it('should make Generate Schedules the main action on the page', async () => {
      courses$.next([course('math')]);

      await renderPage();

      expect(buttonWithText('Generate Schedules')?.hasAttribute('mat-flat-button')).toBeTrue();
    });

    it('should not offer Generate Schedules with no courses', async () => {
      await renderPage();

      expect(buttonWithText('Generate Schedules')).toBeUndefined();
    });
  });

  describe('the courses heading', () => {
    const chips = () => Array.from(element().querySelectorAll('.courses mat-chip'));

    it('should add up the credits', async () => {
      courses$.next([course('math', { credits: 4 }), course('physics', { credits: 3 })]);

      await renderPage();

      expect(element().querySelector('.courses h3')?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Courses 7 credits');
    });

    it('should show a chip with the code for each course', async () => {
      courses$.next([course('math', { subjectCode: 'MTH', courseNumber: '133', credits: 4 }), course('Study Group')]);

      await renderPage();

      expect(chips().map((chip) => chip.textContent?.trim())).toEqual(['MTH 133', 'Study Group']);
    });

    it('should jump to a course from its chip', async () => {
      const scrollToElementId = spyOn(component, 'scrollToElementId');
      courses$.next([course('math')]);

      await renderPage();

      (chips()[0] as HTMLElement).click();

      expect(scrollToElementId).toHaveBeenCalledOnceWith('math');
    });

    it('should add a course from one clearly named button', async () => {
      await renderPage();

      expect(buttonWithText('Add course')).toBeDefined();
      expect(element().textContent).not.toContain('Add new course');
    });
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
