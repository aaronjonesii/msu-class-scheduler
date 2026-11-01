import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { SectionPickerComponent } from './section-picker.component';
import { CourseMeetingType } from '../../enums/course-meeting-type';
import { CourseStatus } from '../../enums/course-status';
import { Day } from '../../enums/day';
import { ReadCourseWithSections } from '../../interfaces/course';
import { ReadCourseSection } from '../../interfaces/course-section';

function section(id: string, status?: CourseStatus): ReadCourseSection {
  return {
    id,
    name: id,
    status,
    meetings: [{
      type: CourseMeetingType.LECTURE,
      location: 'Wells Hall A1',
      instructor: 'Ann Lee',
      meetingTimes: [{ days: [Day.MONDAY], startTime: '09:00', endTime: '09:50' }],
    }],
  };
}

function course(id: string, sections: ReadCourseSection[]): ReadCourseWithSections {
  return { id, name: id, status: CourseStatus.OPEN, isNotMSUCourse: null, sections };
}

describe('SectionPickerComponent', () => {
  let fixture: ComponentFixture<SectionPickerComponent>;
  let picks: ReadonlySet<string>[];

  const math = course('Calculus II', [section('math-1'), section('math-2'), section('math-3')]);
  const physics = course('Physics', [section('physics-1')]);

  const picker = () => fixture.nativeElement as HTMLElement;
  const courseBox = (index = 0) => picker().querySelectorAll<HTMLInputElement>('.course-checkbox input')[index];
  const sectionRow = (id: string) => Array.from(picker().querySelectorAll('.section'))
    .find((row) => row.textContent?.includes(id)) as Element;
  const sectionBox = (id: string) => sectionRow(id).querySelector('input') as HTMLInputElement;

  function render(courses: ReadCourseWithSections[], pickedSectionIds: string[]) {
    fixture = TestBed.createComponent(SectionPickerComponent);
    fixture.componentRef.setInput('courses', courses);
    fixture.componentRef.setInput('pickedSectionIds', new Set(pickedSectionIds));
    fixture.componentInstance.picksChanged.subscribe((picked) => picks.push(picked));
    fixture.detectChanges();
  }

  const lastPicks = () => [...picks[picks.length - 1]].sort();

  beforeEach(async () => {
    picks = [];

    await TestBed.configureTestingModule({
      imports: [SectionPickerComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();
  });

  it('should show the course code and name', () => {
    render([{ ...math, subjectCode: 'MTH', courseNumber: '133' }], []);

    expect(picker().textContent?.replace(/\s+/g, ' ')).toContain('MTH 133 - Calculus II');
  });

  it('should show a course with no code by its name alone', () => {
    render([math], []);

    expect(picker().textContent).toContain('Calculus II');
    expect(picker().textContent).not.toContain('- Calculus II');
  });

  it('should show when and where each section meets, and who teaches it', () => {
    render([math], []);

    expect(sectionRow('math-1').textContent).toContain('Lecture: (Mon: 09:00 - 09:50)');
    expect(sectionRow('math-1').textContent).toContain('Wells Hall A1 · Ann Lee');
  });

  it('should flag a section that is not open', () => {
    render([course('Calculus II', [section('math-1', CourseStatus.CLOSED)])], []);

    expect(sectionRow('math-1').textContent).toContain('Closed');
  });

  it('should not flag an open section', () => {
    render([course('Calculus II', [section('math-1', CourseStatus.OPEN)])], []);

    expect(sectionRow('math-1').textContent).not.toContain('Open');
  });

  it('should go by the course status when a section has none of its own', () => {
    render([{ ...course('Calculus II', [section('math-1')]), status: CourseStatus.WAITlIST }], []);

    expect(sectionRow('math-1').textContent).toContain('Waitlist');
  });

  it('should go by the section status over the course status', () => {
    render([{ ...course('Calculus II', [section('math-1', CourseStatus.OPEN)]), status: CourseStatus.CLOSED }], []);

    expect(sectionRow('math-1').textContent).not.toContain('Closed');
  });

  it('should say when a section has no meetings', () => {
    render([course('Calculus II', [{ ...section('math-1'), meetings: [] }])], []);

    expect(sectionRow('math-1').textContent).toContain('No meetings');
  });

  it('should say how many sections of each course are picked', () => {
    render([math, physics], ['math-1', 'math-3']);

    expect(picker().textContent).toContain('2 of 3 sections');
    expect(picker().textContent).toContain('0 of 1 section');
    expect(picker().textContent).not.toContain('0 of 1 sections');
  });

  describe('the course checkbox', () => {
    it('should be checked when every section is picked', () => {
      render([math], ['math-1', 'math-2', 'math-3']);

      expect(courseBox().checked).toBeTrue();
      expect(courseBox().indeterminate).toBeFalse();
    });

    it('should be partly checked when some sections are picked', () => {
      render([math], ['math-2']);

      expect(courseBox().indeterminate).toBeTrue();
    });

    it('should be unchecked when no section is picked', () => {
      render([math], []);

      expect(courseBox().checked).toBeFalse();
      expect(courseBox().indeterminate).toBeFalse();
    });

    it('should pick every section from unchecked, leaving other courses alone', () => {
      render([math, physics], ['physics-1']);

      courseBox().click();

      expect(lastPicks()).toEqual(['math-1', 'math-2', 'math-3', 'physics-1']);
    });

    it('should drop every section from checked, leaving other courses alone', () => {
      render([math, physics], ['math-1', 'math-2', 'math-3', 'physics-1']);

      courseBox().click();

      expect(lastPicks()).toEqual(['physics-1']);
    });

    it('should pick every section from partly checked', () => {
      render([math], ['math-2']);

      courseBox().click();

      expect(lastPicks()).toEqual(['math-1', 'math-2', 'math-3']);
    });

    it('should not open or close the course when clicked', () => {
      render([math], []);

      courseBox().click();
      fixture.detectChanges();

      expect(picker().querySelector('mat-expansion-panel')?.classList).not.toContain('mat-expanded');
    });
  });

  describe('a section checkbox', () => {
    it('should show whether the section is picked', () => {
      render([math], ['math-2']);

      expect(sectionBox('math-1').checked).toBeFalse();
      expect(sectionBox('math-2').checked).toBeTrue();
    });

    it('should drop just that section', () => {
      render([math], ['math-1', 'math-2']);

      sectionBox('math-1').click();

      expect(lastPicks()).toEqual(['math-2']);
    });

    it('should pick just that section', () => {
      render([math], ['math-1']);

      sectionBox('math-2').click();

      expect(lastPicks()).toEqual(['math-1', 'math-2']);
    });

    it('should leave the set it was given unchanged', () => {
      const given = new Set(['math-1']);
      render([math], []);
      fixture.componentRef.setInput('pickedSectionIds', given);
      fixture.detectChanges();

      sectionBox('math-2').click();

      expect([...given]).toEqual(['math-1']);
    });
  });

  describe('a course with no sections', () => {
    it('should say so and not be pickable', () => {
      render([course('History', [])], []);

      expect(courseBox().disabled).toBeTrue();
      expect(courseBox().checked).toBeFalse();
      expect(picker().textContent).toContain('No sections');
    });

    it('should not open', () => {
      render([course('History', [])], []);

      expect(picker().querySelector('mat-expansion-panel-header')?.getAttribute('aria-disabled')).toBe('true');
    });
  });
});
