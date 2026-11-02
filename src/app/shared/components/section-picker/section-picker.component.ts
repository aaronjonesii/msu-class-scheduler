import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatCheckbox } from "@angular/material/checkbox";
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from "@angular/material/expansion";
import { CourseStatus } from "../../enums/course-status";
import { ReadCourseWithSections } from "../../interfaces/course";
import { ReadCourseSection } from "../../interfaces/course-section";
import { formatCourseMeetings } from "../../utils/format-course-meetings";
import { formatMeetingDetails } from "../../utils/format-meeting-details";
import { sectionStatus } from "../../utils/section-status";

@Component({
  selector: 'csb-section-picker',
  standalone: true,
  imports: [
    MatCheckbox,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
  ],
  templateUrl: './section-picker.component.html',
  styleUrl: './section-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionPickerComponent {
  protected readonly CourseStatus = CourseStatus;
  protected readonly formatCourseMeetings = formatCourseMeetings;
  protected readonly formatMeetingDetails = formatMeetingDetails;
  protected readonly sectionStatus = sectionStatus;

  courses = input.required<ReadCourseWithSections[]>();

  pickedSectionIds = input.required<ReadonlySet<string>>();

  readonly picksChanged = output<ReadonlySet<string>>();

  pickedCount({ sections }: ReadCourseWithSections): number {
    return sections.filter((section) => this.pickedSectionIds().has(section.id)).length;
  }

  allPicked(course: ReadCourseWithSections): boolean {
    return course.sections.length > 0 && this.pickedCount(course) === course.sections.length;
  }

  togglePicks(sections: ReadCourseSection[], checked: boolean) {
    const picked = new Set(this.pickedSectionIds());

    for (const { id } of sections) {
      if (checked) picked.add(id);
      else picked.delete(id);
    }

    this.picksChanged.emit(picked);
  }
}
