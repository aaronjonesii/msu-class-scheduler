import { ComponentFixture, DeferBlockBehavior, DeferBlockState, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { ScheduleDetailComponent } from './schedule-detail.component';
import {
  ScheduleCalendarDialogComponent, ScheduleCalendarDialogContract,
} from '../../shared/dialogs/schedule-calendar-dialog/schedule-calendar-dialog.component';
import { ScheduleCourseStatus } from '../../shared/enums/schedule-course-status';
import { ReadSchedule } from '../../shared/interfaces/schedule';
import { ReadScheduleCourse } from '../../shared/interfaces/schedule-course';
import { LoggerService } from '../../shared/services/logger.service';
import { ScheduleCoursesService } from "../../shared/services/schedule-courses.service";
import { SchedulesService } from "../../shared/services/schedules.service";

const SCHEDULE = { id: 'schedule', userId: 'user', name: 'First choice', description: null } as ReadSchedule;

describe('ScheduleDetailComponent', () => {
  let component: ScheduleDetailComponent;
  let fixture: ComponentFixture<ScheduleDetailComponent>;
  let schedule$: BehaviorSubject<ReadSchedule | null>;
  let courses$: BehaviorSubject<ReadScheduleCourse[]>;

  const course = (id: string, changes: Partial<ReadScheduleCourse> = {}): ReadScheduleCourse => ({
    id, name: id, status: ScheduleCourseStatus.OPEN, isNotMSUCourse: null, meetings: [], ...changes,
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

  beforeEach(async () => {
    schedule$ = new BehaviorSubject<ReadSchedule | null>(SCHEDULE);
    courses$ = new BehaviorSubject<ReadScheduleCourse[]>([]);

    await TestBed.configureTestingModule({
      imports: [ScheduleDetailComponent],
      deferBlockBehavior: DeferBlockBehavior.Manual,
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: LoggerService, useValue: {} },
        { provide: SchedulesService, useValue: { getById$: () => schedule$ } },
        { provide: ScheduleCoursesService, useValue: { getAll$: () => courses$ } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleDetailComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', SCHEDULE.id);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('the top of the page', () => {
    it('should use the name of the schedule as the title', async () => {
      await renderPage();

      expect(element().querySelector('h2')?.textContent?.trim()).toBe('First choice');
    });

    it('should give a schedule with no name a title', async () => {
      schedule$.next({ ...SCHEDULE, name: '' });

      await renderPage();

      expect(element().querySelector('h2')?.textContent?.trim()).toBe('Unnamed schedule');
    });

    it('should still have a title when there is no schedule to show', async () => {
      schedule$.next(null);

      await renderPage();

      expect(element().querySelector('h2')?.textContent?.trim()).toBe('Schedule');
    });

    it('should show the description of the schedule', async () => {
      schedule$.next({ ...SCHEDULE, description: 'Mornings free' });

      await renderPage();

      expect(element().querySelector('.description')?.textContent).toContain('Mornings free');
    });

    it('should leave out an empty description', async () => {
      await renderPage();

      expect(element().querySelector('.description')).toBeNull();
    });

    it('should have no block of details above the courses', async () => {
      await renderPage();

      expect(element().querySelector('.details')).toBeNull();
    });
  });

  describe('adding it to a calendar', () => {
    it('should offer it once there are courses', async () => {
      courses$.next([course('math')]);

      await renderPage();

      expect(buttonWithText('Add to calendar')?.hasAttribute('mat-flat-button')).toBeTrue();
    });

    it('should not offer it with no courses', async () => {
      await renderPage();

      expect(buttonWithText('Add to calendar')).toBeUndefined();
    });

    it('should open with the schedule and its courses', async () => {
      const open = spyOn(TestBed.inject(MatDialog), 'open');
      const math = course('math');
      courses$.next([math]);

      await renderPage();

      buttonWithText('Add to calendar')?.click();

      const { data } = open.calls.mostRecent().args[1] as { data: ScheduleCalendarDialogContract };

      expect(open.calls.mostRecent().args[0]).toBe(ScheduleCalendarDialogComponent);
      expect(data.scheduleId).toBe(SCHEDULE.id);
      expect(data.scheduleName).toBe(SCHEDULE.name);
      expect(data.courses()).toEqual([math]);
    });

    it('should keep the dialog up to date with the courses on the page', async () => {
      const open = spyOn(TestBed.inject(MatDialog), 'open');
      const math = course('math');
      const physics = course('physics');
      courses$.next([math]);

      await renderPage();

      buttonWithText('Add to calendar')?.click();
      courses$.next([math, physics]);

      const { data } = open.calls.mostRecent().args[1] as { data: ScheduleCalendarDialogContract };

      expect(data.courses()).toEqual([math, physics]);
    });
  });

  describe('the courses heading', () => {
    const chips = () => Array.from(element().querySelectorAll('.courses mat-chip')) as HTMLElement[];

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

      chips()[0].click();

      expect(scrollToElementId).toHaveBeenCalledOnceWith('math');
    });

    it('should add a course from one clearly named button', async () => {
      await renderPage();

      expect(buttonWithText('Add course')).toBeDefined();
      expect(element().textContent).not.toContain('Add new course');
    });
  });

  describe('the foot of the page', () => {
    const stamp = (date: string) => ({ toDate: () => new Date(date) });

    it('should show the dates after the week view', async () => {
      schedule$.next({ ...SCHEDULE, created: stamp('2026-10-01T12:00:00'), updated: stamp('2026-10-02T12:00:00') } as ReadSchedule);

      await renderPage();

      const dates = element().querySelector('.dates') as HTMLElement;
      const weekView = element().querySelector('csb-schedule-grid-view') as HTMLElement;

      expect(dates.textContent).toContain('Created on Oct 1, 2026');
      expect(dates.textContent).toContain('Last updated');
      expect(weekView.compareDocumentPosition(dates)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('should leave out an update that never happened', async () => {
      schedule$.next({ ...SCHEDULE, created: stamp('2026-10-01T12:00:00') } as ReadSchedule);

      await renderPage();

      expect(element().querySelector('.dates')?.textContent).not.toContain('Last updated');
    });
  });
});
