import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { CourseSectionsListComponent } from './course-sections-list.component';
import { CourseStatus } from '../../enums/course-status';
import { ReadCourseSection } from '../../interfaces/course-section';
import { LoggerService } from '../../services/logger.service';
import { SemesterPlanCourseSectionsService } from '../../services/semester-plan-course-sections.service';
import { SemesterPlanCoursesService } from '../../services/semester-plan-courses.service';

describe('CourseSectionsListComponent', () => {
  let fixture: ComponentFixture<CourseSectionsListComponent>;

  const titles = () => Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll('mat-panel-title'),
  );
  const names = () => titles().map((t) => t.textContent?.match(/Section: (\S+)/)?.[1]);
  const chipsOf = (index: number) => Array.from(titles()[index].querySelectorAll('mat-chip'))
    .map((chip) => chip.textContent?.trim());

  async function render(sections: ReadCourseSection[], defaultSectionId = '') {
    TestBed.configureTestingModule({
      imports: [CourseSectionsListComponent],
      providers: [
        provideNoopAnimations(),
        { provide: SemesterPlanCourseSectionsService, useValue: { getAll$: () => of(sections) } },
        { provide: SemesterPlanCoursesService, useValue: {} },
        { provide: LoggerService, useValue: {} },
      ],
    });

    fixture = TestBed.createComponent(CourseSectionsListComponent);
    fixture.componentRef.setInput('courseId', 'course');
    fixture.componentRef.setInput('courseSelectedSectionId', defaultSectionId);
    fixture.componentRef.setInput('semesterPlanId', 'plan');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const section = (name: string, status?: CourseStatus | null): ReadCourseSection => ({
    id: name, name, status, meetings: [],
  });

  it('should list sections in order of their names', async () => {
    await render([section('007'), section('001'), section('003')]);

    expect(names()).toEqual(['001', '003', '007']);
  });

  it('should mark a wait list section', async () => {
    await render([section('001', CourseStatus.WAITlIST)]);

    expect(chipsOf(0)).toEqual(['Waitlist']);
  });

  it('should mark a closed section', async () => {
    await render([section('001', CourseStatus.CLOSED)]);

    expect(chipsOf(0)).toEqual(['Closed']);
  });

  it('should not mark an open section or one with no status', async () => {
    await render([section('1', CourseStatus.OPEN), section('2', null), section('3')]);

    expect([chipsOf(0), chipsOf(1), chipsOf(2)]).toEqual([[], [], []]);
  });

  it('should show the default and the status together', async () => {
    await render([section('001', CourseStatus.WAITlIST)], '001');

    expect(chipsOf(0)).toEqual(['Default', 'Waitlist']);
  });
});
