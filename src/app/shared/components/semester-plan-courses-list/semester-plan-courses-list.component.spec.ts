import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { SemesterPlanCoursesListComponent } from './semester-plan-courses-list.component';
import { Color } from '../../enums/color';
import { CourseStatus } from '../../enums/course-status';
import { SemesterTerm } from '../../enums/semester-term';
import { ReadCourse } from '../../interfaces/course';
import { LoggerService } from '../../services/logger.service';
import { SemesterPlanCourseSectionsService } from '../../services/semester-plan-course-sections.service';
import { SemesterPlanCoursesService } from '../../services/semester-plan-courses.service';
import { SemesterPlansService } from '../../services/semester-plans.service';

describe('SemesterPlanCoursesListComponent', () => {
  let fixture: ComponentFixture<SemesterPlanCoursesListComponent>;

  const list = () => fixture.nativeElement as HTMLElement;
  const card = () => list().querySelector('mat-card') as HTMLElement;
  const textOf = (selector: string) => card().querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();
  const credits = () => Array.from(card().querySelectorAll('span'))
    .find((span) => /\d credits?$/.test(span.textContent?.trim() ?? '')) as HTMLElement;

  const course = (changes: Partial<ReadCourse> = {}): ReadCourse => ({
    id: 'course-id', name: 'Electronic Circuits', status: CourseStatus.OPEN, isNotMSUCourse: null, credits: 3, ...changes,
  });

  async function render(changes: Partial<ReadCourse> = {}, width?: string) {
    TestBed.configureTestingModule({
      imports: [SemesterPlanCoursesListComponent],
      providers: [
        provideNoopAnimations(),
        { provide: SemesterPlansService, useValue: { getFormattedTermYear: () => 'SS27' } },
        { provide: SemesterPlanCourseSectionsService, useValue: { getAll$: () => of([]) } },
        { provide: SemesterPlanCoursesService, useValue: {} },
        { provide: LoggerService, useValue: {} },
      ],
    });

    fixture = TestBed.createComponent(SemesterPlanCoursesListComponent);
    if (width) list().style.width = width;
    fixture.componentRef.setInput('term', SemesterTerm.SPRING);
    fixture.componentRef.setInput('year', 2027);
    fixture.componentRef.setInput('semesterPlanId', 'plan');
    fixture.componentRef.setInput('semesterPlanCourses', [course(changes)]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('should show the code as the title and the name under it', async () => {
    await render({ subjectCode: 'ECE', courseNumber: '302' });

    expect(textOf('mat-card-title')).toBe('ECE 302');
    expect(textOf('mat-card-subtitle')).toBe('Electronic Circuits');
  });

  it('should put the name under the code, not beside it', async () => {
    await render({ subjectCode: 'ECE', courseNumber: '331', name: 'Microprocessors & Digital Sys' }, '311px');

    const title = (card().querySelector('mat-card-title') as HTMLElement).getBoundingClientRect();
    const subtitle = (card().querySelector('mat-card-subtitle') as HTMLElement).getBoundingClientRect();

    expect(subtitle.top).toBeGreaterThanOrEqual(title.bottom);
  });

  it('should show a course with no code by its name', async () => {
    await render();

    expect(textOf('mat-card-title')).toBe('Electronic Circuits');
    expect(card().querySelector('mat-card-subtitle')).toBeNull();
  });

  it('should keep the id on the card, because the chips scroll to it', async () => {
    await render();

    expect(card().id).toBe('course-id');
  });

  it('should color the header and leave the rest of the card plain', async () => {
    await render({ color: Color.AZURE });

    expect(card().querySelector('mat-card-header')?.classList).toContain('azure-card');
    expect(card().classList).not.toContain('azure-card');
  });

  it('should say credit for one', async () => {
    await render({ credits: 1 });

    expect(credits().textContent?.trim()).toBe('1 credit');
  });

  it('should never put the credits on top of a long title', async () => {
    await render({ subjectCode: 'MTH', courseNumber: '133', name: 'Calculus', credits: 4 }, '311px');

    const title = (card().querySelector('mat-card-title') as HTMLElement).getBoundingClientRect();
    const creditsBox = credits().getBoundingClientRect();

    expect(title.right).toBeLessThanOrEqual(creditsBox.left);
  });

  it('should keep a long description closed until it is asked for', async () => {
    await render({ description: 'Microcomputers. Microprocessor architecture.' });

    const description = card().querySelector('details') as HTMLDetailsElement;

    expect(description.open).toBeFalse();
    expect(description.querySelector('summary')?.textContent).toContain('Description');
    expect(description.textContent).toContain('Microprocessor architecture.');
  });

  it('should leave out the description when there is none', async () => {
    await render({ description: null });

    expect(card().querySelector('details')).toBeNull();
  });

  it('should not repeat a Sections heading above the sections', async () => {
    await render();

    expect(card().querySelector('h4')).toBeNull();
  });
});
