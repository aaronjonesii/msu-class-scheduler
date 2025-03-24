import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input
} from '@angular/core';
import {
  ReadSchedule,
  ReadScheduleWithCourses
} from "../../interfaces/schedule";
import { appRoutes } from "../../../app.routes";
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
  styleUrl: './schedules-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulesListComponent {
  private scheduleService = inject(SchedulesService);

  protected readonly appRoutes = appRoutes;

  schedules = input<ReadScheduleWithCourses[] | null | undefined>(null);

  filterText = input<string>();

  editSchedule(schedule: ReadScheduleWithCourses) {
    this.scheduleService.openEditDialog(schedule);
  }

  scheduleCredits = (schedule: ReadSchedule) => {
    return schedule.courses
      ?.reduce((acc, c) => acc + (c.credits || 0), 0);
  };
}
