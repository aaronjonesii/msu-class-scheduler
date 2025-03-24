import {
  ChangeDetectionStrategy,
  Component,
  input,
  output
} from '@angular/core';
import { ReadScheduleCourse } from "../../interfaces/schedule-course";
import {
  MatListItem, MatListItemLine,
  MatListItemMeta,
  MatListItemTitle
} from "@angular/material/list";
import { TimePipe } from "../../pipes/time.pipe";
import { MatAnchor, MatButton } from "@angular/material/button";
import { SkeletonComponent } from "../skeleton/skeleton.component";
import {
  MatCardModule,
} from "@angular/material/card";
import { ColorToClassPipe } from "../../pipes/color-to-class.pipe";

@Component({
  selector: 'csb-schedule-courses-list',
  standalone: true,
  imports: [
    MatListItem, TimePipe,
    MatListItemTitle,
    MatListItemLine, SkeletonComponent, MatListItemMeta,
    MatCardModule, MatButton, ColorToClassPipe, MatAnchor,
  ],
  templateUrl: './schedule-courses-list.component.html',
  styleUrl: './schedule-courses-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleCoursesListComponent {
  scheduleCourses = input<ReadScheduleCourse[] | null | undefined>(null);

  readonly editScheduleCourse = output<ReadScheduleCourse>();

  readonly deleteScheduleCourse = output<string>();

  msuCourseLink = (scheduleCourse: ReadScheduleCourse) => {
    const today = new Date();

    const currentMonth = today.getMonth() + 1; // Months are 0-indexed

    const currentYear = today.getFullYear() - 2000; // Get the last two digits of the year

    let term;

    if (currentMonth >= 1 && currentMonth <= 5) {
      term = `SS${currentYear}`; // Spring
    } else if (currentMonth >= 6 && currentMonth <= 8) {
      term = `SU${currentYear}`; // Summer
    } else {
      term = `FS${currentYear}`; // Fall (or the next year if it's late in the year)

      if (currentMonth >= 11) {
        term = `FS${currentYear + 1}`;
      }
    }

    return `https://reg.msu.edu/courses/search.aspx?Term=${term}&SubjectCode=${scheduleCourse.subjectCode?.toUpperCase()}&CourseNumber=${scheduleCourse.courseNumber}#Results`;
  };
}
