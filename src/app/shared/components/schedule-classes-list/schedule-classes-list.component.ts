import {
  ChangeDetectionStrategy,
  Component,
  input,
  output
} from '@angular/core';
import { ReadScheduleClass } from "../../interfaces/schedule-class";
import {
  MatList,
  MatListItem, MatListItemLine,
  MatListItemMeta,
  MatListItemTitle
} from "@angular/material/list";
import { TimePipe } from "../../pipes/time.pipe";
import { MatAnchor, MatButton, MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { SkeletonComponent } from "../skeleton/skeleton.component";
import {
  MatCardModule,
} from "@angular/material/card";
import { MatBadge } from "@angular/material/badge";
import { ColorToClassPipe } from "../../pipes/color-to-class.pipe";

@Component({
  selector: 'csb-schedule-classes-list',
  standalone: true,
  imports: [
    MatList, MatListItem, TimePipe,
    MatIconButton, MatIcon, MatListItemTitle,
    MatListItemLine, SkeletonComponent, MatListItemMeta,
    MatCardModule, MatBadge, MatButton, ColorToClassPipe, MatAnchor,
  ],
  templateUrl: './schedule-classes-list.component.html',
  styleUrl: './schedule-classes-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleClassesListComponent {
  scheduleClasses = input<ReadScheduleClass[] | null | undefined>(null);

  editScheduleClass = output<ReadScheduleClass>();

  deleteScheduleClass = output<string>();

  msuCourseLink = (scheduleClass: ReadScheduleClass) => {
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

    return `https://reg.msu.edu/courses/search.aspx?Term=${term}&SubjectCode=${scheduleClass.subjectCode?.toUpperCase()}&CourseNumber=${scheduleClass.courseNumber}#Results`;
  };
}
