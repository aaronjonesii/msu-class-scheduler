import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of } from 'rxjs';

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
  let logger: jasmine.SpyObj<LoggerService>;

  const dialog = () => document.querySelector('mat-dialog-container') as HTMLElement;
  const buttonWithText = (text: string) => Array.from(dialog().querySelectorAll('button'))
    .find((b) => b.textContent?.trim() === text) as HTMLButtonElement;

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
    const name = dialog().querySelector('input') as HTMLInputElement;
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

              return of(courseId ? sections[courseId] : courses);
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

    it('should explain instead of opening an empty dialog when every combination conflicts', async () => {
      sections = {
        math: [section('math-1', '09:00', '09:50')],
        physics: [section('physics-1', '09:30', '10:20')],
      };

      await service.generateSchedules(PLAN_ID);
      await settle();

      expect(dialog()).toBeNull();
      expect(logger.warn).toHaveBeenCalledOnceWith(jasmine.stringContaining('No schedule fits'));
    });

    it('should explain instead of opening an empty dialog when a course has no sections', async () => {
      courses = [course('math', 'math-1'), course('physics', 'physics-1'), course('history')];
      sections['history'] = [];

      await service.generateSchedules(PLAN_ID);
      await settle();

      expect(dialog()).toBeNull();
      expect(logger.warn).toHaveBeenCalledOnceWith(jasmine.stringContaining('No schedule fits'));
    });
  });
});
