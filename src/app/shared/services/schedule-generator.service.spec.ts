import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { concat, firstValueFrom, map, NEVER, Observable, of, timer } from 'rxjs';

import { AuthService } from './auth.service';
import { FirestoreService } from './firestore.service';
import { LoggerService } from './logger.service';
import { ScheduleGeneratorService } from './schedule-generator.service';
import { CourseMeetingType } from '../enums/course-meeting-type';
import { CourseStatus } from '../enums/course-status';
import { Day } from '../enums/day';
import { ReadCourse } from '../interfaces/course';
import { ReadCourseSection } from '../interfaces/course-section';
import { ScheduleCourse } from '../interfaces/schedule-course';

interface Added {
  path: string,
  data: Record<string, unknown>,
}

const PLAN_ID = 'plan';

function section(id: string, startTime: string, endTime: string, day = Day.MONDAY): ReadCourseSection {
  return {
    id,
    name: id,
    meetings: [{
      type: CourseMeetingType.LECTURE,
      location: null,
      instructor: null,
      meetingTimes: [{ days: [day], startTime, endTime }],
    }],
  };
}

function course(id: string, selectedSectionId?: string): ReadCourse {
  return { id, name: id, status: CourseStatus.OPEN, isNotMSUCourse: null, selectedSectionId };
}

describe('ScheduleGeneratorService', () => {
  let service: ScheduleGeneratorService;
  let added: Added[];
  let courses: ReadCourse[];
  let sections: Record<string, ReadCourseSection[]>;
  let sectionsOf: (courseId: string) => Observable<ReadCourseSection[]>;
  let logger: jasmine.SpyObj<LoggerService>;

  const dialog = () => document.querySelector('mat-dialog-container') as HTMLElement;
  const buttonWithText = (text: string) => Array.from(dialog().querySelectorAll('button'))
    .find((b) => b.textContent?.trim() === text) as HTMLButtonElement;

  const courseBox = (id: string) => dialog().querySelector(`input[aria-label="All sections of ${id}"]`) as HTMLInputElement;
  const sectionBox = (id: string) => Array.from(dialog().querySelectorAll('.section'))
    .find((row) => row.textContent?.includes(id))?.querySelector('input') as HTMLInputElement;

  /** Lets the dialog render, or finish closing, with no animations. */
  async function settle() {
    for (let i = 0; i < 5; i++) {
      TestBed.inject(ApplicationRef).tick();
      await new Promise((resolve) => setTimeout(resolve));
    }
  }

  async function stepForward(times: number) {
    const next = dialog().querySelector('mat-icon[fonticon="chevron_right"]')
      ?.closest('button') as HTMLButtonElement;

    for (let i = 0; i < times; i++) next.click();

    await settle();
  }

  async function createSchedule() {
    const name = dialog().querySelector('input[name="name"]') as HTMLInputElement;
    name.value = 'My schedule';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();

    buttonWithText('Create').click();
    await settle();
  }

  const scheduleDocs = () => added.filter((a) => a.path === 'schedules');
  const scheduleCourseDocs = () => added.filter((a) => a.path.endsWith('/courses'));

  /** The saved time of each course, like "math 11:00". */
  const savedTimes = () => scheduleCourseDocs().map(({ data }) => {
    const { name, meetings } = data as unknown as ScheduleCourse;

    return `${name} ${meetings[0]?.meetingTimes[0]?.startTime ?? 'no meeting'}`;
  });

  beforeEach(() => {
    added = [];
    courses = [course('math', 'math-1'), course('physics', 'physics-1')];
    sections = {
      math: [section('math-1', '09:00', '09:50'), section('math-2', '11:00', '11:50')],
      physics: [section('physics-1', '13:00', '13:50'), section('physics-2', '15:00', '15:50')],
    };
    sectionsOf = (courseId) => of(sections[courseId]);
    logger = jasmine.createSpyObj<LoggerService>('LoggerService', ['info', 'warn', 'error']);

    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        { provide: LoggerService, useValue: logger },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
        { provide: AuthService, useValue: { authState$: () => of({ uid: 'user' }) } },
        {
          provide: FirestoreService,
          useValue: {
            doc$: () => of({ id: PLAN_ID, userId: 'user' }),
            col$: (path: string) => {
              const [, courseId] = path.match(/courses\/([^/]+)\/sections$/) ?? [];

              return courseId ? sectionsOf(courseId) : of(courses);
            },
            add: async (path: string, data: Record<string, unknown>) => {
              added.push({ path, data });

              return { id: 'new-schedule' };
            },
          },
        },
      ],
    });

    service = TestBed.inject(ScheduleGeneratorService);
  });

  afterEach(async () => {
    dialog()?.querySelector<HTMLButtonElement>('button[mat-dialog-close]')?.click();
    await settle();
  });

  describe('getSemesterPlanWithCourses$', () => {
    const planCourses = async () =>
      (await firstValueFrom(service.getSemesterPlanWithCourses$(PLAN_ID))).courses;
    const later = (courseId: string) => timer(5).pipe(map(() => sections[courseId]));

    it('should keep the order of the plan when sections arrive out of order', async () => {
      sectionsOf = (courseId) => courseId === 'math' ? later(courseId) : of(sections[courseId]);

      expect((await planCourses()).map((c) => c.id)).toEqual(['math', 'physics']);
    });

    it('should keep every course once when sections arrive twice for one of them', async () => {
      sectionsOf = (courseId) => courseId === 'math' ?
        concat(of(sections[courseId]), of(sections[courseId])) : later(courseId);

      expect((await planCourses()).map((c) => c.id)).toEqual(['math', 'physics']);
    });

    it('should not wait for a listener to end, because a live one never does', async () => {
      sectionsOf = (courseId) => concat(of(sections[courseId]), NEVER);

      expect((await planCourses()).map((c) => c.id)).toEqual(['math', 'physics']);
    });

    it('should order sections by name, like the plan page', async () => {
      sections['math'] = ['010', '002', '001'].map((name) => section(name, '09:00', '09:50'));

      expect((await planCourses())[0].sections.map((s) => s.name)).toEqual(['001', '002', '010']);
    });

    it('should have no courses for a plan with none', async () => {
      courses = [];

      expect(await planCourses()).toEqual([]);
    });
  });

  describe('courseToScheduleCourse', () => {
    const math = {
      ...course('math', 'math-2'),
      sections: [section('math-1', '09:00', '09:50'), { ...section('math-2', '10:00', '10:50'), name: '002 + LEC1' }],
    };

    it('should keep the name of the section the schedule uses', () => {
      expect(service.courseToScheduleCourse(math).sectionName).toBe('002 + LEC1');
    });

    it('should use null with no section chosen, because Firestore refuses undefined', () => {
      expect(service.courseToScheduleCourse(course('math')).sectionName).toBeNull();
    });
  });

  describe('fittingCombinations', () => {
    const everySection = ['math-1', 'math-2', 'physics-1', 'physics-2'];
    const withSections = (id: string) => ({ ...course(id), sections: sections[id] });

    /** Each schedule as its sections, like "math-1 physics-2". */
    const fitting = (picks: string[], plan = [withSections('math'), withSections('physics')]) =>
      service.fittingCombinations(plan, new Set(picks))
        .map((combination) => combination.map((c) => c.selectedSectionId).join(' '));

    it('should keep the numbering of schedules when everything is picked', () => {
      expect(fitting(everySection)).toEqual([
        'math-1 physics-1', 'math-1 physics-2', 'math-2 physics-1', 'math-2 physics-2',
      ]);
    });

    it('should leave out a section that is not picked', () => {
      expect(fitting(['math-1', 'physics-1', 'physics-2'])).toEqual(['math-1 physics-1', 'math-1 physics-2']);
    });

    it('should leave out a course with no sections picked', () => {
      expect(fitting(['math-1', 'math-2'])).toEqual(['math-1', 'math-2']);
    });

    it('should leave out a course that has no sections', () => {
      sections['history'] = [];

      expect(fitting(everySection, [withSections('math'), withSections('history')])).toEqual(['math-1', 'math-2']);
    });

    it('should have no schedules when nothing is picked', () => {
      expect(fitting([])).toEqual([]);
    });

    it('should have no schedules when there are no courses', () => {
      expect(fitting(everySection, [])).toEqual([]);
    });

    it('should still leave out sections that conflict', () => {
      sections['physics'] = [section('physics-1', '09:30', '10:20'), section('physics-2', '15:00', '15:50')];

      expect(fitting(everySection)).toEqual(['math-1 physics-2', 'math-2 physics-1', 'math-2 physics-2']);
    });
  });

  describe('generateSchedules', () => {
    it('should save the sections of the combination on screen, not the defaults', async () => {
      await service.generateSchedules(PLAN_ID);
      await settle();

      await stepForward(3);
      await createSchedule();

      expect(savedTimes()).toEqual(['math 11:00', 'physics 15:00']);
    });

    it('should save the first combination when the user does not step away from it', async () => {
      courses = [course('math', 'math-2'), course('physics', 'physics-2')];

      await service.generateSchedules(PLAN_ID);
      await settle();

      await createSchedule();

      expect(savedTimes()).toEqual(['math 09:00', 'physics 13:00']);
    });

    it('should save the section on screen for a course with no default', async () => {
      courses = [course('math', 'math-1'), course('physics', 'physics-1'), course('history')];
      sections['history'] = [section('history-1', '17:00', '17:50')];

      await service.generateSchedules(PLAN_ID);
      await settle();

      await createSchedule();

      expect(savedTimes()).toEqual(['math 09:00', 'physics 13:00', 'history 17:00']);
    });

    it('should keep an online section with no meeting time, which cannot conflict', async () => {
      const online = { ...section('math-online', '09:00', '09:50'), meetings: [{
        type: CourseMeetingType.LECTURE, location: 'Online Asynchronous', instructor: null, meetingTimes: [],
      }] };
      sections['math'] = [online];
      courses = [course('math', 'math-online'), course('physics', 'physics-1')];

      await service.generateSchedules(PLAN_ID);
      await settle();

      await createSchedule();

      expect(savedTimes()).toEqual(['math no meeting', 'physics 13:00']);
      expect((scheduleCourseDocs()[0].data as unknown as ScheduleCourse).meetings[0].location)
        .toBe('Online Asynchronous');
    });

    it('should use the status of the section on screen', async () => {
      sections['math'] = [{ ...section('math-1', '09:00', '09:50'), status: CourseStatus.WAITlIST }];

      await service.generateSchedules(PLAN_ID);
      await settle();

      await createSchedule();

      expect(scheduleCourseDocs()[0].data['status']).toBe(CourseStatus.WAITlIST);
    });

    it('should use the course status when the section has none', async () => {
      courses = [{ ...course('math', 'math-1'), status: CourseStatus.CLOSED }, course('physics', 'physics-1')];

      await service.generateSchedules(PLAN_ID);
      await settle();

      await createSchedule();

      expect(scheduleCourseDocs()[0].data['status']).toBe(CourseStatus.CLOSED);
    });

    it('should keep the courses in their own documents, not on the schedule', async () => {
      await service.generateSchedules(PLAN_ID);
      await settle();

      await createSchedule();

      expect(scheduleDocs().length).toBe(1);
      expect(scheduleDocs()[0].data['courses']).toBeUndefined();
      expect(scheduleCourseDocs().every((d) => d.path === 'schedules/new-schedule/courses')).toBeTrue();
    });

    it('should save nothing when the dialog is cancelled', async () => {
      await service.generateSchedules(PLAN_ID);
      await settle();

      buttonWithText('Cancel').click();
      await settle();

      expect(added).toEqual([]);
    });

    describe('when every combination conflicts', () => {
      beforeEach(async () => {
        sections = {
          math: [section('math-1', '09:00', '09:50')],
          physics: [section('physics-1', '09:30', '10:20')],
        };

        await service.generateSchedules(PLAN_ID);
        await settle();
      });

      it('should open and explain, because only the picks can fix it', () => {
        expect(dialog().querySelector('[role="alert"]')?.textContent).toContain('No schedule fits');
        expect(buttonWithText('Create').disabled).toBeTrue();
        expect(logger.warn).not.toHaveBeenCalled();
      });

      it('should fit once one of the courses is turned off', async () => {
        courseBox('physics').click();
        await settle();

        await createSchedule();

        expect(savedTimes()).toEqual(['math 09:00']);
      });
    });

    it('should leave out a course with no sections and offer the rest', async () => {
      courses = [course('math', 'math-1'), course('physics', 'physics-1'), course('history')];
      sections['history'] = [];

      await service.generateSchedules(PLAN_ID);
      await settle();

      expect(dialog().textContent).toContain('/ 4');
      expect(dialog().textContent).toContain('No sections');

      await createSchedule();

      expect(savedTimes()).toEqual(['math 09:00', 'physics 13:00']);
    });

    it('should explain instead of opening when no course has a section', async () => {
      sections = { math: [], physics: [] };

      await service.generateSchedules(PLAN_ID);
      await settle();

      expect(dialog()).toBeNull();
      expect(logger.warn).toHaveBeenCalledOnceWith('Add a section to a course before generating schedules.');
    });

    it('should explain instead of opening when the plan has no courses', async () => {
      courses = [];

      await service.generateSchedules(PLAN_ID);
      await settle();

      expect(dialog()).toBeNull();
      expect(logger.warn).toHaveBeenCalledOnceWith('Add a section to a course before generating schedules.');
    });

    it('should open for a single course', async () => {
      courses = [course('math', 'math-1')];

      await service.generateSchedules(PLAN_ID);
      await settle();

      expect(dialog().textContent).toContain('/ 2');
    });

    it('should not need default sections', async () => {
      courses = [course('math'), course('physics')];

      await service.generateSchedules(PLAN_ID);
      await settle();

      expect(dialog().textContent).toContain('/ 4');
    });

    it('should save what is on screen after narrowing the picks', async () => {
      await service.generateSchedules(PLAN_ID);
      await settle();

      await stepForward(3);
      sectionBox('physics-2').click();
      await settle();

      await createSchedule();

      expect(savedTimes()).toEqual(['math 11:00', 'physics 13:00']);
    });

    it('should show the schedule on screen in the week, and follow the picks', async () => {
      const tileNames = () => Array.from(dialog().querySelectorAll('.tile.course .name'))
        .map((name) => name.textContent);

      await service.generateSchedules(PLAN_ID);
      await settle();

      expect(tileNames()).toEqual(['math', 'physics']);

      courseBox('physics').click();
      await settle();

      expect(tileNames()).toEqual(['math']);

      courseBox('physics').click();
      await settle();

      expect(tileNames()).toEqual(['math', 'physics']);
    });

    it('should start with everything picked when opened again', async () => {
      await service.generateSchedules(PLAN_ID);
      await settle();

      sectionBox('math-1').click();
      await settle();

      buttonWithText('Cancel').click();
      await settle();

      await service.generateSchedules(PLAN_ID);
      await settle();

      expect(dialog().textContent).toContain('/ 4');
    });
  });
});
