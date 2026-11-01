import { Component, inject, input } from '@angular/core';
import {
  SemesterPlanCourseSectionsService
} from "../../services/semester-plan-course-sections.service";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { switchMap, combineLatest, map } from "rxjs";
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelActionRow,
  MatExpansionPanelDescription,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from "@angular/material/expansion";
import { MatButton } from "@angular/material/button";
import { CourseStatus } from "../../enums/course-status";
import { ReadCourseSection } from "../../interfaces/course-section";
import { formatCourseMeetings } from "../../utils/format-course-meetings";
import { sortSectionsByName } from "../../utils/sort-sections-by-name";
import { SemesterPlanCoursesService } from "../../services/semester-plan-courses.service";
import { MatChip } from "@angular/material/chips";
import { LoggerService } from "../../services/logger.service";

@Component({
  selector: 'csb-course-sections-list',
  standalone: true,
  imports: [
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatExpansionPanelDescription,
    MatButton,
    MatExpansionPanelActionRow,
    MatChip
  ],
  templateUrl: './course-sections-list.component.html',
  styleUrl: './course-sections-list.component.scss'
})
export class CourseSectionsListComponent {
  private semesterPlanCourseSectionsService = inject(SemesterPlanCourseSectionsService)
  private semesterPlanCoursesService = inject(SemesterPlanCoursesService)
  private logger = inject(LoggerService)

  protected readonly CourseStatus = CourseStatus;

  courseId = input.required<string>();
  courseSelectedSectionId = input.required<string>();
  semesterPlanId = input.required<string>();

  sections = toSignal(
    combineLatest([
      toObservable(this.semesterPlanId),
      toObservable(this.courseId)
    ]).pipe(
      switchMap(([semesterPlanId, courseId]) => this.semesterPlanCourseSectionsService.getAll$(semesterPlanId, courseId)),
      map(sortSectionsByName),
    )
  );

  sectionDescription = formatCourseMeetings;

  editSection = (section: ReadCourseSection) => {
    this.semesterPlanCourseSectionsService.openEditSectionDialog(this.semesterPlanId(), this.courseId(), section);
  }
  deleteSection = (sectionId: string) => {
    this.semesterPlanCourseSectionsService.openDeleteSectionDialog(this.semesterPlanId(), this.courseId(), sectionId);
  }

  defaultSection = async (sectionId: string) => {
    await this.semesterPlanCoursesService.update(this.semesterPlanId(), this.courseId(), { selectedSectionId: sectionId })
      .then(() => this.logger.info('Section set as default'))
      .catch(error => this.logger.error('An error occurred updating course default section', error));
  }
}
