import { Component, inject, input } from '@angular/core';
import {
  SemesterPlanCourseSectionsService
} from "../../services/semester-plan-course-sections.service";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { switchMap, combineLatest } from "rxjs";
import {
  MatAccordion,
  MatExpansionPanel, MatExpansionPanelDescription, MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from "@angular/material/expansion";

@Component({
  selector: 'csb-course-sections-list',
  standalone: true,
  imports: [
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatExpansionPanelDescription
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
}
