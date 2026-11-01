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

  const combination = (id: string) => [{ id, name: id, sections: [] }] as unknown as ReadCourseWithSelectedSection[];
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
});
