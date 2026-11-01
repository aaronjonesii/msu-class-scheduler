import { inject, Injectable } from '@angular/core';
import { FirestorePaths } from '../../firestore.routes';
import { Color, DefaultColor } from '../enums/color';
import { CourseStatus } from '../enums/course-status';
import { Course, ReadCourse } from '../interfaces/course';
import { ReadCourseSection } from '../interfaces/course-section';
import { MsuClassOption, MsuClassPage } from '../utils/parse-msu-class-page';
import { FirestoreService } from './firestore.service';
import { LoggerService } from './logger.service';

export interface MsuClassImportResult {
  added: number,
  skipped: number,
}

interface NewSection {
  id: string,
  option: MsuClassOption,
}

function isSameCourse(course: ReadCourse, page: MsuClassPage): boolean {
  // Courses saved before numbers could hold a letter have a plain number.
  return course.subjectCode?.toUpperCase() === page.subjectCode &&
    String(course.courseNumber) === page.courseNumber;
}

function toNewCourse(page: MsuClassPage, defaultSection: NewSection, courses: ReadCourse[]): Course {
  return {
    name: page.name,
    status: defaultSection.option.status ?? CourseStatus.OPEN,
    subjectCode: page.subjectCode,
    courseNumber: page.courseNumber,
    description: page.description,
    credits: page.credits,
    // The grid tells courses apart by color.
    color: Object.values(Color).find((color) => !courses.some((c) => c.color === color)) ?? DefaultColor,
    isNotMSUCourse: null,
    selectedSectionId: defaultSection.id,
  };
}

@Injectable({ providedIn: 'root' })
export class MsuClassImportService {
  private db = inject(FirestoreService);
  private logger = inject(LoggerService);

  /**
   * Saves the options picked from an MSU class page as sections, creating the
   * course if the plan doesn't have it yet. Sections already in the plan are
   * left alone, so pasting a page again only adds what's new.
   */
  async importClass(
    semesterPlanId: string,
    page: MsuClassPage,
    options: MsuClassOption[],
  ): Promise<MsuClassImportResult | null> {
    try {
      // Read now rather than trust a list from when the dialog opened.
      const courses = await this.getCourses(semesterPlanId);
      const course = courses.find((c) => isSameCourse(c, page));
      const courseId = course?.id ?? this.db.newDocumentID;
      const existingNames = course ? await this.getSectionNames(semesterPlanId, courseId) : [];
      const sections = options
        .filter((option) => !existingNames.includes(option.sectionName))
        .map((option) => ({ id: this.db.newDocumentID, option }));

      if (sections.length > 0) await this.save(semesterPlanId, courseId, course, page, sections, courses);

      return { added: sections.length, skipped: options.length - sections.length };
    } catch (error: unknown) {
      this.logger.error(`Error importing ${page.courseCode} for semester plan: ${semesterPlanId}`, error);

      return null;
    }
  }

  private async getCourses(semesterPlanId: string): Promise<ReadCourse[]> {
    const courses = await this.db.colSnap<ReadCourse>(FirestorePaths.semesterPlanCourses(semesterPlanId));

    return courses.docs.map((course) => ({ ...course.data(), id: course.id }));
  }

  private async getSectionNames(semesterPlanId: string, courseId: string): Promise<string[]> {
    const sections = await this.db.colSnap<ReadCourseSection>(
      FirestorePaths.semesterPlanCourseSections(semesterPlanId, courseId),
    );

    return sections.docs.map((section) => section.data().name);
  }

  private save(
    semesterPlanId: string,
    courseId: string,
    course: ReadCourse | undefined,
    page: MsuClassPage,
    sections: NewSection[],
    courses: ReadCourse[],
  ): Promise<void> {
    return this.db.batch(async (batch) => {
      const timestamp = this.db.timestamp;

      for (const { id, option } of sections) {
        batch.set(this.db.doc(FirestorePaths.semesterPlanCourseSection(semesterPlanId, courseId, id)), {
          name: option.sectionName,
          status: option.status,
          meetings: option.meetings,
          created: timestamp,
        });
      }

      // Generate Schedules only uses courses that have a default section.
      const defaultSection = sections.find((s) => s.option.inCart) ??
        sections.find((s) => s.option.status === CourseStatus.OPEN) ?? sections[0];
      const courseRef = this.db.doc(FirestorePaths.semesterPlanCourse(semesterPlanId, courseId));

      if (course) {
        batch.update(courseRef, {
          updated: timestamp,
          ...(course.selectedSectionId ? {} : { selectedSectionId: defaultSection.id }),
        });
      } else {
        batch.set(courseRef, { ...toNewCourse(page, defaultSection, courses), created: timestamp });
      }

      batch.update(this.db.doc(FirestorePaths.semesterPlan(semesterPlanId)), 'updated', timestamp);
    });
  }
}
