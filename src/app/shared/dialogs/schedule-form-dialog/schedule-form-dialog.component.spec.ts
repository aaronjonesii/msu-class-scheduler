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

  function typeNumber(value: string, box = numberBoxes()[0]) {
    box.value = value;
    box.dispatchEvent(new Event('change'));
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

  describe('changing the picks', () => {
    // Schedules: 1 m1 p1, 2 m1 p2, 3 m2 p1, 4 m2 p2.
    const plan = [course('math', ['m1', 'm2']), course('physics', ['p1', 'p2'])];

    function pick(...sectionIds: string[]) {
      component.onPicksChange(new Set(sectionIds));
      fixture.detectChanges();
    }

    const sectionBox = (name: string) => Array.from(dialog().querySelectorAll('.section'))
      .find((row) => row.textContent?.includes(name))?.querySelector('input') as HTMLInputElement;

    beforeEach(async () => {
      await setUp({ courses: plan });

      typeNumber('3');
    });

    it('should start with every section picked', () => {
      expect([...component.pickedSectionIds()]).toEqual(['m1', 'm2', 'p1', 'p2']);
      expect(dialog().textContent).toContain('/ 4');
    });

    it('should use a pick made in the list', () => {
      sectionBox('m1').click();
      fixture.detectChanges();

      expect(dialog().textContent).toContain('/ 2');
    });

    it('should stay on the schedule when another section is turned off, and renumber it', () => {
      pick('m2', 'p1', 'p2');

      expect(courseIds()).toEqual(['m2', 'p1']);
      expect(numberBoxes()[0].value).toBe('1');
    });

    it('should change only that course when a section on screen is turned off', () => {
      pick('m1', 'm2', 'p2');

      expect(courseIds()).toEqual(['m2', 'p2']);
    });

    it('should keep every section on screen that is still picked, not just the first', () => {
      typeNumber('4');

      pick('m2', 'p1', 'p2');

      expect(courseIds()).toEqual(['m2', 'p2']);
      expect(numberBoxes()[0].value).toBe('2');
    });

    it('should leave the courses shown alone when the schedule on screen stays the same', () => {
      component.shownCourses.set(['m2']);

      pick('m2', 'p1', 'p2');

      expect(courseIds()).toEqual(['m2', 'p1']);
      expect(component.shownCourses()).toEqual(['m2']);
    });

    it('should show every course again when another schedule comes on screen', () => {
      component.shownCourses.set(['m2']);

      component.nextCombination();
      fixture.detectChanges();

      expect(component.shownCourses()).toEqual(['m2', 'p2']);
    });

    it('should keep the other courses when a whole course is turned off', () => {
      pick('m1', 'm2');

      expect(courseIds()).toEqual(['m2']);
    });

    it('should show a course again when it is turned back on', () => {
      pick('m1', 'm2');
      pick('m1', 'm2', 'p1', 'p2');

      expect(courseIds()).toEqual(['m2', 'p1']);
      expect(component.shownCourses()).toEqual(['m2', 'p1']);
    });

    it('should go to the first schedule when nothing on screen is left', () => {
      pick('m1', 'p2');

      expect(courseIds()).toEqual(['m1', 'p2']);
      expect(numberBoxes()[0].value).toBe('1');
    });

    it('should explain when nothing is picked, then recover', () => {
      pick();

      expect(dialog().querySelector('[role="alert"]')).not.toBeNull();
      expect(numberBoxes().length).toBe(0);

      pick('m1', 'p1');

      expect(dialog().querySelector('[role="alert"]')).toBeNull();
      expect(courseIds()).toEqual(['m1', 'p1']);
    });

    it('should keep the name typed so far', () => {
      typeName();

      pick();
      pick('m1', 'p1');

      expect((dialog().querySelector('input[name="name"]') as HTMLInputElement).value).toBe('Fall');
    });
  });

  describe('when the picks that are left no longer fit with the schedule on screen', () => {
    it('should keep as many of its sections as it can', async () => {
      // Schedules: 1 m1 p1 c1, 2 m1 p2 c1, 3 m2 p1 c1, 4 m2 p1 c2, 5 m2 p2 c1, 6 m2 p2 c2. m1 clashes with c2.
      const [math, physics, chem] = [course('math', ['m1', 'm2']), course('physics', ['p1', 'p2']), course('chem', ['c1', 'c2'])];
      math.sections[0].meetings = [MONDAY_AT_9];
      chem.sections[1].meetings = [MONDAY_AT_9];

      await setUp({ courses: [math, physics, chem] });

      typeNumber('2');

      component.onPicksChange(new Set(['m1', 'm2', 'p1', 'p2', 'c2']));
      fixture.detectChanges();

      expect(courseIds()).toEqual(['m2', 'p2', 'c2']);
      expect(numberBoxes()[0].value).toBe('2');
    });

    it('should go to the first schedule when none of its sections can stay', async () => {
      // Schedules: 1 a1 c1, 2 a1 c2, 3 a1 c3, 4 a2 c1. a2 clashes with c2 and c3.
      const [a, c] = [course('a', ['a1', 'a2']), course('c', ['c1', 'c2', 'c3'])];
      a.sections[1].meetings = [MONDAY_AT_9];
      c.sections[1].meetings = [MONDAY_AT_9];
      c.sections[2].meetings = [MONDAY_AT_9];

      await setUp({ courses: [a, c] });

      typeNumber('4');

      component.onPicksChange(new Set(['a1', 'a2', 'c2', 'c3']));
      fixture.detectChanges();

      expect(courseIds()).toEqual(['a1', 'c2']);
      expect(numberBoxes()[0].value).toBe('1');
    });
  });

  describe('when creating or editing by hand', () => {
    it('should show nothing about generating', async () => {
      await setUp();

      expect(dialog().querySelector('[role="alert"]')).toBeNull();
      expect(dialog().querySelector('csb-schedule-grid-view')).toBeNull();
      expect(dialog().querySelector('csb-section-picker')).toBeNull();
    });

    it('should keep Create off until there is a name', async () => {
      await setUp();

      expect(createButton().disabled).toBeTrue();

      typeName();

      expect(createButton().disabled).toBeFalse();
    });
  });
});
