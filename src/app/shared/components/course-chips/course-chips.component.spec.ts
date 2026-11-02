import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTooltip } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { CourseChipsComponent } from './course-chips.component';
import { Color } from '../../enums/color';
import { CourseStatus } from '../../enums/course-status';
import { ReadCourse } from '../../interfaces/course';
import { ColorToClassPipe } from '../../pipes/color-to-class.pipe';

describe('CourseChipsComponent', () => {
  let fixture: ComponentFixture<CourseChipsComponent>;

  const element = () => fixture.nativeElement as HTMLElement;
  const chips = () => Array.from(element().querySelectorAll('mat-chip')) as HTMLElement[];

  const course = (id: string, changes: Partial<ReadCourse> = {}): ReadCourse => ({
    id, name: id, status: CourseStatus.OPEN, isNotMSUCourse: null, ...changes,
  });

  function render(courses: ReadCourse[] | null | undefined) {
    fixture.componentRef.setInput('courses', courses);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseChipsComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(CourseChipsComponent);
  });

  it('should show the code of a course and the name of one with no code', () => {
    render([course('math', { subjectCode: 'MTH', courseNumber: '133' }), course('Study Group')]);

    expect(chips().map((chip) => chip.textContent?.trim())).toEqual(['MTH 133', 'Study Group']);
  });

  it('should keep the full name a hover away', () => {
    render([course('math', { name: 'Calculus II', subjectCode: 'MTH', courseNumber: '133' })]);

    const tooltip = fixture.debugElement.query(By.directive(MatTooltip)).injector.get(MatTooltip);

    expect(tooltip.message).toBe('Calculus II');
  });

  it('should color a chip like its course', () => {
    render([course('math', { color: Color.AZURE })]);

    expect(chips()[0].classList).toContain('azure-chip');
  });

  it('should tint every color of chip like the header of its course', () => {
    const colors = Object.values(Color);

    render(colors.map((color) => course(color, { color })));

    const header = element().appendChild(document.createElement('div'));

    colors.forEach((color, index) => {
      header.className = new ColorToClassPipe().transform(color, 'card');

      const chip = chips()[index];
      const label = chip.querySelector('.mdc-evolution-chip__text-label') as HTMLElement;

      expect(getComputedStyle(chip).backgroundColor).withContext(color).toBe(getComputedStyle(header).backgroundColor);
      expect(getComputedStyle(label).color).withContext(color).toBe(getComputedStyle(header).color);
    });
  });

  it('should say which course was clicked', () => {
    const clicked: string[] = [];
    fixture.componentInstance.courseClicked.subscribe((id) => clicked.push(id));

    render([course('math'), course('physics')]);

    chips()[1].click();

    expect(clicked).toEqual(['physics']);
  });

  it('should be a named list for a screen reader, because a plain chip set has no role', () => {
    render([course('math')]);

    const chipSet = element().querySelector('mat-chip-set');

    expect(chipSet?.getAttribute('role')).toBe('list');
    expect(chipSet?.getAttribute('aria-label')).toBe('Jump to a course');
    expect(chips()[0].getAttribute('role')).toBe('listitem');
  });

  it('should show nothing with no courses', () => {
    render([]);

    expect(element().querySelector('mat-chip-set')).toBeNull();
  });

  it('should show nothing while the courses load', () => {
    render(undefined);

    expect(element().querySelector('mat-chip-set')).toBeNull();
  });

  it('should leave no box of its own, so an empty list adds no gap to the page', () => {
    render([]);

    expect(element().getClientRects().length).toBe(0);
  });
});
