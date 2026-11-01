import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { CourseSectionsListComponent } from './course-sections-list.component';
import { CourseMeetingType } from '../../enums/course-meeting-type';
import { CourseStatus } from '../../enums/course-status';
import { ReadCourse } from '../../interfaces/course';
import { ReadCourseSection } from '../../interfaces/course-section';
import { LoggerService } from '../../services/logger.service';
import { SemesterPlanCourseSectionsService } from '../../services/semester-plan-course-sections.service';
import { SemesterPlanCoursesService } from '../../services/semester-plan-courses.service';
import { parseMsuClassPage } from '../../utils/parse-msu-class-page';
import { ECE_331_PAGE } from '../../utils/parse-msu-class-page.fixtures';

describe('CourseSectionsListComponent', () => {
  let fixture: ComponentFixture<CourseSectionsListComponent>;
  let sectionsService: jasmine.SpyObj<SemesterPlanCourseSectionsService>;
  let coursesService: jasmine.SpyObj<SemesterPlanCoursesService>;

  const list = () => fixture.nativeElement as HTMLElement;
  const rows = () => Array.from(list().querySelectorAll('.section'));
  const names = () => rows().map((row) => row.querySelector('.section-name')?.textContent);
  const textOf = (row: Element, selector: string) => row.querySelector(selector)?.textContent?.trim();
  const menuItems = () => Array.from(document.querySelectorAll<HTMLElement>('.mat-mdc-menu-item'));
  const menuItem = (text: string) => menuItems().find((item) => item.textContent?.trim() === text) as HTMLElement;

  const course = (changes: Partial<ReadCourse> = {}): ReadCourse => ({
    id: 'course', name: 'Course', status: CourseStatus.OPEN, isNotMSUCourse: null, ...changes,
  });

  const section = (name: string, status?: CourseStatus | null): ReadCourseSection => ({
    id: name, name, status, meetings: [],
  });

  async function render(sections: ReadCourseSection[], courseChanges: Partial<ReadCourse> = {}) {
    sectionsService = jasmine.createSpyObj<SemesterPlanCourseSectionsService>(
      'SemesterPlanCourseSectionsService', ['getAll$', 'openEditSectionDialog', 'openDeleteSectionDialog'],
    );
    sectionsService.getAll$.and.returnValue(of(sections));
    coursesService = jasmine.createSpyObj<SemesterPlanCoursesService>('SemesterPlanCoursesService', ['update']);
    coursesService.update.and.resolveTo();

    TestBed.configureTestingModule({
      imports: [CourseSectionsListComponent],
      providers: [
        provideNoopAnimations(),
        { provide: SemesterPlanCourseSectionsService, useValue: sectionsService },
        { provide: SemesterPlanCoursesService, useValue: coursesService },
        { provide: LoggerService, useValue: jasmine.createSpyObj('LoggerService', ['info', 'error']) },
      ],
    });

    fixture = TestBed.createComponent(CourseSectionsListComponent);
    fixture.componentRef.setInput('course', course(courseChanges));
    fixture.componentRef.setInput('semesterPlanId', 'plan');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function openMenu(row = rows()[0]) {
    (row.querySelector('.section-menu') as HTMLElement).click();
    fixture.detectChanges();
  }

  afterEach(() => {
    (document.querySelector('.cdk-overlay-backdrop') as HTMLElement | null)?.click();
  });

  it('should list sections in order of their names', async () => {
    await render([section('007'), section('001'), section('003')]);

    expect(names()).toEqual(['001', '003', '007']);
  });

  it('should say when there are no sections', async () => {
    await render([]);

    expect(list().textContent).toContain('No sections');
  });

  describe('a section row', () => {
    const meeting = {
      type: CourseMeetingType.LECTURE,
      location: 'Wonders Hall C213',
      instructor: 'Matthew Meier',
      meetingTimes: [],
    };

    it('should show the room and instructor without opening anything', async () => {
      await render([{ ...section('001'), meetings: [meeting] }]);

      expect(rows()[0].textContent).toContain('Wonders Hall C213');
      expect(rows()[0].textContent).toContain('Matthew Meier');
      expect(list().querySelector('mat-expansion-panel')).toBeNull();
    });

    it('should show each meeting of a section', async () => {
      await render([{ ...section('001'), meetings: [meeting, { ...meeting, location: 'Engineering Building 3230' }] }]);

      expect(rows()[0].querySelectorAll('csb-course-meeting').length).toBe(2);
    });

    it('should say when a section has no meetings', async () => {
      await render([section('001')]);

      expect(rows()[0].textContent).toContain('No meetings');
    });

    it('should show that a section is open, without calling it out', async () => {
      await render([section('001', CourseStatus.OPEN)]);

      expect(textOf(rows()[0], '.status')).toBe('Open');
      expect(rows()[0].querySelector('.status')?.classList).not.toContain('error-color');
    });

    it('should call out a wait list section', async () => {
      await render([section('001', CourseStatus.WAITlIST)]);

      expect(textOf(rows()[0], '.status')).toBe('Waitlist');
      expect(rows()[0].querySelector('.status')?.classList).toContain('error-color');
    });

    it('should call out a closed section', async () => {
      await render([section('001', CourseStatus.CLOSED)]);

      expect(textOf(rows()[0], '.status')).toBe('Closed');
      expect(rows()[0].querySelector('.status')?.classList).toContain('error-color');
    });

    it('should go by the course status when a section has none of its own', async () => {
      await render([section('001')], { status: CourseStatus.WAITlIST });

      expect(textOf(rows()[0], '.status')).toBe('Waitlist');
    });

    it('should mark only the default section', async () => {
      await render([section('001'), section('002')], { selectedSectionId: '002' });

      expect(textOf(rows()[0], '.default')).toBeUndefined();
      expect(textOf(rows()[1], '.default')).toBe('Default');
    });
  });

  describe('a meeting every section has', () => {
    const lecture = {
      type: CourseMeetingType.LECTURE, location: 'Wonders Hall C213', instructor: 'Matthew Meier', meetingTimes: [],
    };
    const lab = { ...lecture, type: CourseMeetingType.LABORATORY, location: 'Engineering Building 3230' };
    const shared = () => list().querySelector('.shared');

    it('should show once, above the sections', async () => {
      await render([
        { ...section('001'), meetings: [lab, lecture] },
        { ...section('002'), meetings: [{ ...lab, instructor: 'Ann Lee' }, lecture] },
      ]);

      expect(shared()?.textContent).toContain('Every section has');
      expect(shared()?.textContent).toContain('Wonders Hall C213');
      expect(rows().map((row) => row.textContent?.includes('Wonders Hall C213'))).toEqual([false, false]);
      expect(rows().map((row) => row.textContent?.includes('Engineering Building 3230'))).toEqual([true, true]);
    });

    it('should stay on the rows when any section differs', async () => {
      await render([
        { ...section('001'), meetings: [lecture] },
        { ...section('002'), meetings: [{ ...lecture, location: 'Wells Hall A1' }] },
      ]);

      expect(shared()).toBeNull();
      expect(rows()[0].textContent).toContain('Wonders Hall C213');
    });

    it('should not call a section with only shared meetings empty', async () => {
      await render([
        { ...section('001'), meetings: [lecture] },
        { ...section('002'), meetings: [lecture] },
      ]);

      expect(rows()[0].textContent).not.toContain('No meetings');
    });
  });

  describe('the actions of a section', () => {
    it('should be named for screen readers', async () => {
      await render([section('001')]);

      expect(rows()[0].querySelector('.section-menu')?.getAttribute('aria-label')).toBe('Actions for section 001');
    });

    it('should offer to set as default, edit and delete', async () => {
      await render([section('001')]);

      openMenu();

      expect(menuItems().map((item) => item.textContent?.trim())).toEqual(['Set as Default', 'Edit', 'Delete']);
    });

    it('should not offer to set the default section as default', async () => {
      await render([section('001')], { selectedSectionId: '001' });

      openMenu();

      expect(menuItems().map((item) => item.textContent?.trim())).toEqual(['Edit', 'Delete']);
    });

    it('should set the section as the default', async () => {
      await render([section('001')]);

      openMenu();
      menuItem('Set as Default').click();

      expect(coursesService.update).toHaveBeenCalledOnceWith('plan', 'course', { selectedSectionId: '001' });
    });

    it('should edit the section', async () => {
      const toEdit = section('001');
      await render([toEdit]);

      openMenu();
      menuItem('Edit').click();

      expect(sectionsService.openEditSectionDialog).toHaveBeenCalledOnceWith('plan', 'course', toEdit);
    });

    it('should delete the section', async () => {
      await render([section('001')]);

      openMenu();
      menuItem('Delete').click();

      expect(sectionsService.openDeleteSectionDialog).toHaveBeenCalledOnceWith('plan', 'course', '001');
    });
  });

  it('should fit the real ECE 331 sections on a phone with no sideways scrolling', async () => {
    const { page } = parseMsuClassPage(ECE_331_PAGE);
    const sections = page?.options.map((option) => ({
      id: option.sectionName, name: option.sectionName, status: option.status, meetings: option.meetings,
    })) as ReadCourseSection[];

    await render(sections);

    list().style.width = '311px';
    fixture.detectChanges();

    expect(list().scrollWidth).toBeLessThanOrEqual(list().clientWidth);
    rows().forEach((row) => expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth));
  });
});
