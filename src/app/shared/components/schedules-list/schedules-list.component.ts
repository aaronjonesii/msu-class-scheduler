import { Component, input } from '@angular/core';
import { ReadSchedule } from "../../interfaces/schedule";
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
  schedules = input<ReadSchedule[] | null | undefined>(null);
  protected readonly appRoutes = appRoutes;
}
