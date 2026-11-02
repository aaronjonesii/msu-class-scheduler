import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatChip, MatChipSet } from "@angular/material/chips";
import { MatTooltip } from "@angular/material/tooltip";
import { ReadCourse } from "../../interfaces/course";
import { ReadScheduleCourse } from "../../interfaces/schedule-course";
import { ColorToClassPipe } from "../../pipes/color-to-class.pipe";

@Component({
  selector: 'csb-course-chips',
  standalone: true,
  imports: [MatChipSet, MatChip, MatTooltip, ColorToClassPipe],
  templateUrl: './course-chips.component.html',
  styleUrl: './course-chips.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseChipsComponent {
  courses = input<(ReadCourse | ReadScheduleCourse)[] | null | undefined>(null);

  readonly courseClicked = output<string>();
}
