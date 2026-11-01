import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleFormDialogComponent, ScheduleFormDialogContract } from './schedule-form-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { provideAnimations } from "@angular/platform-browser/animations";
import { ReadCourseWithSelectedSection } from "../../interfaces/course";
import { ReadSchedule } from "../../interfaces/schedule";
import { ScheduleGeneratorService } from "../../services/schedule-generator.service";

describe('ScheduleFormDialogComponent', () => {
  let component: ScheduleFormDialogComponent;
  let fixture: ComponentFixture<ScheduleFormDialogComponent>;

  const combination = (id: string) => [{ id, name: id, sections: [], meetings: [] }] as unknown as ReadCourseWithSelectedSection[];
  const courseIds = () => component.scheduleToSave().courses?.map((c) => c.id);

  async function setUp(contract: Partial<ScheduleFormDialogContract> = {}) {
    await TestBed.configureTestingModule({
      imports: [ScheduleFormDialogComponent],
      providers: [
        provideAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: { userId: 'user', ...contract } },
        { provide: MatDialogRef, useValue: { updateSize: () => undefined } },
        {
          provide: ScheduleGeneratorService,
          useValue: { courseToScheduleCourse: (course: { id: string }) => course },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleFormDialogComponent);
    component = fixture.componentInstance;
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
      await setUp({ combinations: [combination('first'), combination('second')] });

      expect(courseIds()).toEqual(['first']);
    });

    it('should follow the combination on screen', async () => {
      await setUp({ combinations: [combination('first'), combination('second')] });

      component.nextCombination();

      expect(courseIds()).toEqual(['second']);

      component.previousCombination();

      expect(courseIds()).toEqual(['first']);
    });
  });

  describe('schedule numbers', () => {
    const three = [combination('first'), combination('second'), combination('third')];

    const numberBoxes = () => Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input[type="number"]'),
    );

    function typeNumber(value: string, box = numberBoxes()[0]) {
      box.value = value;
      box.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    }

    it('should number the first schedule 1', async () => {
      await setUp({ combinations: three });

      expect(numberBoxes()[0].value).toBe('1');
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('/ 3');
    });

    it('should number the last schedule the same as the total', async () => {
      await setUp({ combinations: three });

      component.nextCombination();
      component.nextCombination();
      fixture.detectChanges();

      expect(numberBoxes()[0].value).toBe('3');
    });

    it('should go to the number typed', async () => {
      await setUp({ combinations: three });

      typeNumber('2');

      expect(courseIds()).toEqual(['second']);
    });

    it('should keep the number at the top and the one above the grid the same', async () => {
      await setUp({ combinations: three });

      typeNumber('3', numberBoxes()[1]);

      expect(numberBoxes().map((box) => box.value)).toEqual(['3', '3']);
    });

    it('should go to the last schedule for a number past the end', async () => {
      await setUp({ combinations: three });

      typeNumber('99');

      expect(courseIds()).toEqual(['third']);
      expect(numberBoxes()[0].value).toBe('3');
    });

    it('should correct the box when already on the last schedule', async () => {
      await setUp({ combinations: three });

      typeNumber('3');
      typeNumber('99');

      expect(numberBoxes()[0].value).toBe('3');
    });

    it('should go to the first schedule for a number below 1', async () => {
      await setUp({ combinations: three });

      typeNumber('2');
      typeNumber('-4');

      expect(courseIds()).toEqual(['first']);
      expect(numberBoxes()[0].value).toBe('1');
    });

    it('should stay put and put the number back when the box is emptied', async () => {
      await setUp({ combinations: three });

      typeNumber('2');
      typeNumber('');

      expect(courseIds()).toEqual(['second']);
      expect(numberBoxes()[0].value).toBe('2');
    });

    it('should drop a decimal', async () => {
      await setUp({ combinations: three });

      typeNumber('2.9');

      expect(courseIds()).toEqual(['second']);
      expect(numberBoxes()[0].value).toBe('2');
    });

    it('should stay on the first or last schedule when stepping past the ends', async () => {
      await setUp({ combinations: three });

      component.previousCombination();

      expect(courseIds()).toEqual(['first']);

      typeNumber('3');
      component.nextCombination();

      expect(courseIds()).toEqual(['third']);
    });

    it('should select the number when clicked, so typing replaces it', async () => {
      await setUp({ combinations: three });

      const select = spyOn(numberBoxes()[0], 'select');
      numberBoxes()[0].click();

      expect(select).toHaveBeenCalled();
    });

    it('should not appear when creating a schedule by hand', async () => {
      await setUp();

      expect(numberBoxes().length).toBe(0);
    });
  });
});
