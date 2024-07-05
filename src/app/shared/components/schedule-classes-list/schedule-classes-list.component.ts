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
import { MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { SkeletonComponent } from "../skeleton/skeleton.component";

@Component({
  selector: 'csb-schedule-classes-list',
  standalone: true,
  imports: [
    MatList, MatListItem, TimePipe,
    MatIconButton, MatIcon, MatListItemTitle,
    MatListItemLine, SkeletonComponent, MatListItemMeta,
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
