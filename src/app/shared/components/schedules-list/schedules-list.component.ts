import { Component, inject, input } from '@angular/core';
import {
  ReadSchedule,
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
import { MatCardModule } from "@angular/material/card";
import { MatChip, MatChipSet } from "@angular/material/chips";
import { ColorToClassPipe } from "../../pipes/color-to-class.pipe";
import { MatAnchor, MatButton } from "@angular/material/button";
import { SchedulesService } from "../../services/schedules.service";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";

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
    SkeletonComponent,
    MatCardModule,
    MatChipSet,
    MatChip,
    ColorToClassPipe,
    MatButton,
    MatAnchor,
    MatIcon,
    MatTooltip,
  ],
  templateUrl: './schedules-list.component.html',
  styleUrl: './schedules-list.component.scss'
})
export class SchedulesListComponent {
  private scheduleService = inject(SchedulesService);

  protected readonly appRoutes = appRoutes;

  schedules = input<ReadScheduleWithClasses[] | null | undefined>(null);

  filterText  = input<string>();

  editSchedule(schedule: ReadScheduleWithClasses) {
    this.scheduleService.openEditScheduleDialog(schedule);
  }

  scheduleCredits = (schedule: ReadSchedule) => {
    return schedule.classes
      ?.reduce((acc, c) => acc + (c.credits || 0), 0);
  };
}
