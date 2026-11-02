import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import {
  SemesterPlanCourseSectionsService
} from "../../services/semester-plan-course-sections.service";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { switchMap, combineLatest, map } from "rxjs";
import { MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatMenu, MatMenuItem, MatMenuTrigger } from "@angular/material/menu";
import { CourseStatus } from "../../enums/course-status";
import { ReadCourse } from "../../interfaces/course";
import { ReadCourseSection } from "../../interfaces/course-section";
import { sectionStatus } from "../../utils/section-status";
import { ownMeetings, sharedMeetings } from "../../utils/shared-meetings";
import { sortSectionsByName } from "../../utils/sort-sections-by-name";
import { SemesterPlanCoursesService } from "../../services/semester-plan-courses.service";
import { LoggerService } from "../../services/logger.service";
import { CourseMeetingComponent } from "../course-meeting/course-meeting.component";

@Component({
  selector: 'csb-course-sections-list',
  standalone: true,
  imports: [
    MatIconButton,
    MatIcon,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    CourseMeetingComponent,
  ],
  templateUrl: './course-sections-list.component.html',
  styleUrl: './course-sections-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseSectionsListComponent {
  private semesterPlanCourseSectionsService = inject(SemesterPlanCourseSectionsService)
  private semesterPlanCoursesService = inject(SemesterPlanCoursesService)
  private logger = inject(LoggerService)

  protected readonly CourseStatus = CourseStatus;
  protected readonly sectionStatus = sectionStatus;
  protected readonly ownMeetings = ownMeetings;

  course = input.required<ReadCourse>();
  semesterPlanId = input.required<string>();

  /** So an update to the course doesn't reload its sections. */
  private courseId = computed(() => this.course().id);

  sections = toSignal(
    combineLatest([
      toObservable(this.semesterPlanId),
      toObservable(this.courseId)
    ]).pipe(
      switchMap(([semesterPlanId, courseId]) => this.semesterPlanCourseSectionsService.getAll$(semesterPlanId, courseId)),
      map(sortSectionsByName),
    )
  );

  meetingsOfEverySection = computed(() => sharedMeetings(this.sections() ?? []));

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
