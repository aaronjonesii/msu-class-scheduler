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
import { MatButton, MatIconButton } from "@angular/material/button";
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
    MatListItemLine, SkeletonComponent, MatListItemMeta, MatCardModule, MatBadge, MatButton, ColorToClassPipe,
  ],
  templateUrl: './schedule-classes-list.component.html',
  styleUrl: './schedule-classes-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleClassesListComponent {
  scheduleClasses = input<ReadScheduleClass[] | null | undefined>(null);

  editScheduleClass = output<ReadScheduleClass>();

  deleteScheduleClass = output<string>();
}
