import { Component, input } from '@angular/core';
import {
  ReadScheduleWithClasses
} from "../../interfaces/schedule";
import { appRoutes } from "../../../app.routes";
import { DatePipe } from "@angular/common";
import {
  MatListItemLine,
  MatListItemTitle,
  MatNavList
} from "@angular/material/list";
import { MatMenuItem } from "@angular/material/menu";
import { RouterLink } from "@angular/router";
import { SkeletonComponent } from "../skeleton/skeleton.component";
import { ReadScheduleClass } from "../../interfaces/schedule-class";

@Component({
  selector: 'csb-schedules-list',
  standalone: true,
  imports: [
    DatePipe,
    MatListItemLine,
    MatListItemTitle,
    MatMenuItem,
    MatNavList,
    RouterLink,
    SkeletonComponent
  ],
  templateUrl: './schedules-list.component.html',
  styleUrl: './schedules-list.component.scss'
})
export class SchedulesListComponent {
  protected readonly appRoutes = appRoutes;

  schedules = input<ReadScheduleWithClasses[] | null | undefined>(null);

  scheduleClassesText = (scheduleClasses: ReadScheduleClass[]) => {
    if (!scheduleClasses.length) return 'Classes: No classes yet';

    const scheduleClassesText = scheduleClasses.map((c) => {
      return c?.subjectCode && c?.courseNumber ? `` : c.name;
    });

    return `Classes: ${scheduleClassesText.join(', ')}`;
  };
}
