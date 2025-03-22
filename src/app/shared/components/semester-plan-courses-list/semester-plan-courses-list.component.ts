import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { ColorToClassPipe } from "../../pipes/color-to-class.pipe";
import {
  MatCard, MatCardActions,
  MatCardContent,
  MatCardHeader,
  MatCardSubtitle, MatCardTitle,
  MatCardTitleGroup
} from "@angular/material/card";
import { MatAnchor, MatButton } from "@angular/material/button";
import { SemesterTerm } from "../../enums/semester-term";
import { SemesterPlansService } from "../../services/semester-plans.service";
import { ReadCourse } from "../../interfaces/course";
import {
  CourseSectionsListComponent
} from "../course-sections-list/course-sections-list.component";

@Component({
  selector: 'csb-semester-plan-courses-list',
  standalone: true,
  imports: [
    ColorToClassPipe,
    MatCard,
    MatCardHeader,
    MatCardTitleGroup,
    MatCardContent,
    MatCardTitle,
    MatCardSubtitle,
    MatCardActions,
    MatAnchor,
    MatButton,
    CourseSectionsListComponent,
  ],
  templateUrl: './semester-plan-courses-list.component.html',
  styleUrl: './semester-plan-courses-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SemesterPlanCoursesListComponent {
  private semesterPlansService = inject(SemesterPlansService);

  term = input.required<SemesterTerm>();

  year = input.required<number>();

  semesterPlanId = input.required<string>();

  semesterPlanCourses = input<ReadCourse[] | undefined | null>(null);

  readonly editSemesterPlanCourse = output<ReadCourse>();

  readonly deleteSemesterPlanCourse = output<string>();

  readonly addSemesterPlanCourseSection = output<string>();

  msuCourseLink = (course: ReadCourse) => {

    const _term = this.semesterPlansService.getFormattedTermYear(this.term(), this.year());

    return `https://reg.msu.edu/courses/search.aspx?Term=${_term}&SubjectCode=${course.subjectCode?.toUpperCase()}&CourseNumber=${course.courseNumber}#Results`;
  };
}
