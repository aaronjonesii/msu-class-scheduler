import {
  ChangeDetectionStrategy,
  Component,
  input, model,
  output,
  signal
} from '@angular/core';
import { ReadScheduleCourse } from "../../interfaces/schedule-course";
import { Day } from "../../enums/day";
import { FormsModule } from "@angular/forms";
import { KeyValuePipe } from "@angular/common";
import {
  ScheduleGridComponent
} from "../schedule-grid/schedule-grid.component";
import { MatButton } from "@angular/material/button";
import { MatChipListbox, MatChipOption } from "@angular/material/chips";
import { MatSlider, MatSliderThumb } from "@angular/material/slider";

@Component({
  selector: 'csb-schedule-grid-view',
  standalone: true,
  imports: [
    FormsModule,
    KeyValuePipe,
    ScheduleGridComponent,
    MatButton,
    MatChipListbox,
    MatChipOption,
    MatSlider,
    MatSliderThumb,
  ],
  templateUrl: './schedule-grid-view.component.html',
  styleUrl: './schedule-grid-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleGridViewComponent {
  protected readonly Day = Day;

  scheduleCourses = input<ReadScheduleCourse[] | null | undefined>(null);

  shownCourses = model<string[]>([]);

  readonly courseClicked = output<ReadScheduleCourse>();

  timeSlotIncrement = signal(60);

  days = signal(
    Object.values(Day).filter((d) => ![Day.SATURDAY, Day.SUNDAY].includes(d)),
  );

  startTime = signal('08:00');

  endTime = signal('19:00');

  showGridOptions = signal(false);

  keepSameOrder = () => 1;
}
