import { Component, inject, input } from '@angular/core';
import {
  SemesterPlanCourseSectionsService
} from "../../services/semester-plan-course-sections.service";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { switchMap, combineLatest } from "rxjs";
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelActionRow,
  MatExpansionPanelDescription,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from "@angular/material/expansion";
import { MatButton } from "@angular/material/button";
import { CourseMeeting } from "../../interfaces/course-meeting";
import { Day } from "../../enums/day";
import { ReadCourseSection } from "../../interfaces/course-section";

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
    MatExpansionPanelActionRow
  ],
  templateUrl: './course-sections-list.component.html',
  styleUrl: './course-sections-list.component.scss'
})
export class CourseSectionsListComponent {
  private semesterPlanCourseSectionsService = inject(SemesterPlanCourseSectionsService)

  courseId = input.required<string>();
  semesterPlanId = input.required<string>();

  sections = toSignal(
    combineLatest([
      toObservable(this.semesterPlanId),
      toObservable(this.courseId)
    ]).pipe(
      switchMap(([semesterPlanId, courseId]) => this.semesterPlanCourseSectionsService.getAll$(semesterPlanId, courseId))
    )
  );

  sectionDescription = (meetings: CourseMeeting[]): string => {
    const list: string[] = [];

    for (const meeting of meetings) {
      const { type } = meeting;
      const meetingTimes: string[] = []
      for (const meetingTime of meeting.meetingTimes) {
        const { days, startTime, endTime } = meetingTime;
        const daysInitials = days.map(this.dayToInitial);
        meetingTimes.push(`${daysInitials.join(' ')}: ${startTime} - ${endTime}`);
      }
      list.push(`${type}: (${meetingTimes.join(', ')})`);
    }

    return list.join('; ');
  }

  editSection = (section: ReadCourseSection) => {
    this.semesterPlanCourseSectionsService.openEditSectionDialog(this.semesterPlanId(), this.courseId(), section);
  }
  deleteSection = (sectionId: string) => {
    this.semesterPlanCourseSectionsService.openDeleteSectionDialog(this.semesterPlanId(), this.courseId(), sectionId);
  }

  private dayToInitial = (day: Day): string => {
    switch (day) {
      case Day.MONDAY:
        return 'Mon';
      case Day.TUESDAY:
        return 'Tue';
      case Day.WEDNESDAY:
        return 'Wed';
      case Day.THURSDAY:
        return 'Thu';
      case Day.FRIDAY:
        return 'Fri';
      case Day.SATURDAY:
        return 'Sat';
      case Day.SUNDAY:
        return 'Sun';
      default:
        return '?';
    }
  }
}
