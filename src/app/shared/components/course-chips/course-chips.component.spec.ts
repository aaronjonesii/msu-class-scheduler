import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTooltip } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { CourseChipsComponent } from './course-chips.component';
import { Color } from '../../enums/color';
import { CourseStatus } from '../../enums/course-status';
import { ReadCourse } from '../../interfaces/course';

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

  it('should say which course was clicked', () => {
    const clicked: string[] = [];
    fixture.componentInstance.courseClicked.subscribe((id) => clicked.push(id));

    render([course('math'), course('physics')]);

    chips()[1].click();

    expect(clicked).toEqual(['physics']);
  });

  it('should say what the chips are for', () => {
    render([course('math')]);

    expect(element().querySelector('mat-chip-set')?.getAttribute('aria-label')).toBe('Jump to a course');
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
