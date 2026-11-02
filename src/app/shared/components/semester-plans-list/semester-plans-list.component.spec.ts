import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTooltip } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { SemesterPlansListComponent } from './semester-plans-list.component';
import { ReadSemesterPlanWithCourses } from '../../interfaces/semester-plan';
import { SemesterPlansService } from '../../services/semester-plans.service';

describe('SemesterPlansListComponent', () => {
  let component: SemesterPlansListComponent;
  let fixture: ComponentFixture<SemesterPlansListComponent>;

  const list = () => fixture.nativeElement as HTMLElement;
  const credits = () => Array.from(list().querySelectorAll('mat-card span'))
    .find((span) => /\d credits?$/.test(span.textContent?.trim() ?? '')) as HTMLElement;

  async function render(semesterPlan: Partial<ReadSemesterPlanWithCourses>, width?: string) {
    if (width) list().style.width = width;
    fixture.componentRef.setInput('semesterPlans', [{ id: 'plan', name: 'Plan', courses: [], ...semesterPlan }]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SemesterPlansListComponent],
      providers: [
        provideRouter([]),
        {
          provide: SemesterPlansService,
          useValue: { formatSemesterPlanName: ({ name }: ReadSemesterPlanWithCourses) => name },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(SemesterPlansListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add up the credits of the courses', async () => {
    await render({ courses: [{ credits: 4 }, { credits: 3 }] as ReadSemesterPlanWithCourses['courses'] });

    expect(credits().textContent?.trim()).toBe('7 credits');
  });

  it('should say credit for one', async () => {
    await render({ courses: [{ credits: 1 }] as ReadSemesterPlanWithCourses['courses'] });

    expect(credits().textContent?.trim()).toBe('1 credit');
  });

  it('should never put the credits on top of a long name', async () => {
    await render({ name: 'A plan with quite a long name for one line' }, '311px');

    const title = (list().querySelector('mat-card-title') as HTMLElement).getBoundingClientRect();

    expect(title.right).toBeLessThanOrEqual(credits().getBoundingClientRect().left);
  });

  describe('the chips on a card', () => {
    const tooltip = () => fixture.debugElement.query(By.directive(MatTooltip)).injector.get(MatTooltip);

    it('should need no label above them', async () => {
      await render({ courses: [{ id: 'math', name: 'Calculus II' }] as ReadSemesterPlanWithCourses['courses'] });

      expect(list().querySelector('label')).toBeNull();
    });

    it('should need no label while they load', () => {
      expect(list().querySelector('mat-card')).not.toBeNull();
      expect(list().querySelector('label')).toBeNull();
    });

    it('should be a named list for a screen reader, because a plain chip set has no role', async () => {
      await render({ courses: [{ id: 'math', name: 'Calculus II' }] as ReadSemesterPlanWithCourses['courses'] });

      const chipSet = list().querySelector('mat-chip-set');

      expect(chipSet?.getAttribute('role')).toBe('list');
      expect(chipSet?.getAttribute('aria-label')).toBe('Courses in this plan');
      expect(list().querySelector('mat-chip')?.getAttribute('role')).toBe('listitem');
    });

    it('should show the name and credits of a course on hover', async () => {
      await render({ courses: [{ id: 'math', name: 'Calculus II', credits: 1 }] as ReadSemesterPlanWithCourses['courses'] });

      expect(tooltip().message).toBe('Calculus II - 1 credit');
    });

    it('should not say undefined for a course with no credits', async () => {
      await render({ courses: [{ id: 'club', name: 'Study Group' }] as ReadSemesterPlanWithCourses['courses'] });

      expect(tooltip().message).toBe('Study Group - 0 credits');
    });
  });
});
