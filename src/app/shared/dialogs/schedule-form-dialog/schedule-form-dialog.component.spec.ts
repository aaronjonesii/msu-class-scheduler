import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleFormDialogComponent, ScheduleFormDialogContract } from './schedule-form-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { provideAnimations } from "@angular/platform-browser/animations";
import { Router } from "@angular/router";
import { of } from "rxjs";
import { CourseMeetingType } from "../../enums/course-meeting-type";
import { Day } from "../../enums/day";
import { CourseMeeting } from "../../interfaces/course-meeting";
import { ReadCourseWithSections } from "../../interfaces/course";
import { ReadSchedule } from "../../interfaces/schedule";
import { ScheduleCourse } from "../../interfaces/schedule-course";
import { AuthService } from "../../services/auth.service";
import { FirestoreService } from "../../services/firestore.service";
import { ScheduleGeneratorService } from "../../services/schedule-generator.service";

const MONDAY_AT_9: CourseMeeting = {
  type: CourseMeetingType.LECTURE,
  location: null,
  instructor: null,
  meetingTimes: [{ days: [Day.MONDAY], startTime: '09:00', endTime: '09:50' }],
};

function course(id: string, sectionIds: string[], meetings: CourseMeeting[] = []) {
  const sections = sectionIds.map((sectionId) => ({ id: sectionId, name: sectionId, meetings }));

  return { id, name: id, sections } as unknown as ReadCourseWithSections;
}

/** One course, so each section is one schedule. */
const planWith = (...sectionIds: string[]) => [course('course', sectionIds)];

describe('ScheduleFormDialogComponent', () => {
  let component: ScheduleFormDialogComponent;
  let fixture: ComponentFixture<ScheduleFormDialogComponent>;

  /** The saved "courses" here are the sections on screen. */
  const courseIds = () => component.scheduleToSave().courses?.map((c) => c.id);
  const dialog = () => fixture.nativeElement as HTMLElement;
  const numberBoxes = () => Array.from(dialog().querySelectorAll<HTMLInputElement>('input[type="number"]'));
  const createButton = () => Array.from(dialog().querySelectorAll('button'))
    .find((b) => b.textContent?.trim() === 'Create') as HTMLButtonElement;

  async function setUp(contract: Partial<ScheduleFormDialogContract> = {}) {
    await TestBed.configureTestingModule({
      imports: [ScheduleFormDialogComponent],
      providers: [
        provideAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: { userId: 'user', ...contract } },
        { provide: MatDialogRef, useValue: {} },
        { provide: AuthService, useValue: { authState$: () => of(null) } },
        { provide: FirestoreService, useValue: {} },
        { provide: Router, useValue: {} },
      ],
    }).compileComponents();

    spyOn(TestBed.inject(ScheduleGeneratorService), 'courseToScheduleCourse')
      .and.callFake(({ selectedSectionId }) => ({ id: selectedSectionId, meetings: [] }) as unknown as ScheduleCourse);

    fixture = TestBed.createComponent(ScheduleFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function typeName() {
    const name = dialog().querySelector('input[name="name"]') as HTMLInputElement;
    name.value = 'Fall';
    name.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setUp();

    expect(component).toBeTruthy();
  });

  describe('scheduleToSave', () => {
    it('should have no courses when creating a schedule by hand', async () => {
      await setUp();

      expect(component.scheduleToSave().courses).toEqual([]);
    });

    it('should keep the form details and id when editing a schedule', async () => {
      const schedule = { id: 'existing', userId: 'user', name: 'Fall', description: 'Notes' } as ReadSchedule;

      await setUp({ schedule });

      expect(component.scheduleToSave()).toEqual(jasmine.objectContaining({
        id: 'existing', name: 'Fall', description: 'Notes', courses: [],
      }));
    });

    it('should have the courses of the first combination to begin with', async () => {
      await setUp({ courses: planWith('first', 'second') });

      expect(courseIds()).toEqual(['first']);
    });

    it('should follow the combination on screen', async () => {
      await setUp({ courses: planWith('first', 'second') });

      component.nextCombination();

      expect(courseIds()).toEqual(['second']);

      component.previousCombination();

      expect(courseIds()).toEqual(['first']);
    });
  });

  describe('schedule numbers', () => {
    const three = planWith('first', 'second', 'third');

    function typeNumber(value: string, box = numberBoxes()[0]) {
      box.value = value;
      box.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    }

    it('should number the first schedule 1', async () => {
      await setUp({ courses: three });

      expect(numberBoxes()[0].value).toBe('1');
      expect(dialog().textContent).toContain('/ 3');
    });

    it('should number the last schedule the same as the total', async () => {
      await setUp({ courses: three });

      component.nextCombination();
      component.nextCombination();
      fixture.detectChanges();

      expect(numberBoxes()[0].value).toBe('3');
    });

    it('should go to the number typed', async () => {
      await setUp({ courses: three });

      typeNumber('2');

      expect(courseIds()).toEqual(['second']);
    });

    it('should keep the number at the top and the one above the grid the same', async () => {
      await setUp({ courses: three });

      typeNumber('3', numberBoxes()[1]);

      expect(numberBoxes().map((box) => box.value)).toEqual(['3', '3']);
    });

    it('should go to the last schedule for a number past the end', async () => {
      await setUp({ courses: three });

      typeNumber('99');

      expect(courseIds()).toEqual(['third']);
      expect(numberBoxes()[0].value).toBe('3');
    });

    it('should correct the box when already on the last schedule', async () => {
      await setUp({ courses: three });

      typeNumber('3');
      typeNumber('99');

      expect(numberBoxes()[0].value).toBe('3');
    });

    it('should go to the first schedule for a number below 1', async () => {
      await setUp({ courses: three });

      typeNumber('2');
      typeNumber('-4');

      expect(courseIds()).toEqual(['first']);
      expect(numberBoxes()[0].value).toBe('1');
    });

    it('should stay put and put the number back when the box is emptied', async () => {
      await setUp({ courses: three });

      typeNumber('2');
      typeNumber('');

      expect(courseIds()).toEqual(['second']);
      expect(numberBoxes()[0].value).toBe('2');
    });

    it('should drop a decimal', async () => {
      await setUp({ courses: three });

      typeNumber('2.9');

      expect(courseIds()).toEqual(['second']);
      expect(numberBoxes()[0].value).toBe('2');
    });

    it('should stay on the first or last schedule when stepping past the ends', async () => {
      await setUp({ courses: three });

      component.previousCombination();

      expect(courseIds()).toEqual(['first']);

      typeNumber('3');
      component.nextCombination();

      expect(courseIds()).toEqual(['third']);
    });

    it('should select the number when clicked, so typing replaces it', async () => {
      await setUp({ courses: three });

      const select = spyOn(numberBoxes()[0], 'select');
      numberBoxes()[0].click();

      expect(select).toHaveBeenCalled();
    });

    it('should not appear when creating a schedule by hand', async () => {
      await setUp();

      expect(numberBoxes().length).toBe(0);
    });
  });

  describe('when no schedule fits', () => {
    const clashing = [course('math', ['math-1'], [MONDAY_AT_9]), course('physics', ['physics-1'], [MONDAY_AT_9])];

    beforeEach(async () => {
      await setUp({ courses: clashing });
    });

    it('should say so and how to fix it', () => {
      expect(dialog().querySelector('[role="alert"]')?.textContent?.trim())
        .toBe('No schedule fits these picks. Turn on more sections, or turn off a course that conflicts.');
    });

    it('should hide the schedule numbers, because there is nothing to number', () => {
      expect(numberBoxes().length).toBe(0);
    });

    it('should keep the week on screen, so its options are not lost', () => {
      expect(dialog().querySelector('csb-schedule-grid-view')).not.toBeNull();
    });

    it('should not let an empty schedule be created', () => {
      typeName();

      expect(createButton().disabled).toBeTrue();
      expect(component.scheduleToSave().courses).toEqual([]);
    });
  });

  describe('when creating or editing by hand', () => {
    it('should show nothing about generating', async () => {
      await setUp();

      expect(dialog().querySelector('[role="alert"]')).toBeNull();
      expect(dialog().querySelector('csb-schedule-grid-view')).toBeNull();
    });

    it('should leave Create on once there is a name', async () => {
      await setUp();

      typeName();

      expect(createButton().disabled).toBeFalse();
    });
  });
});
