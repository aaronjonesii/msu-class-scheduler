import {
  ChangeDetectionStrategy,
  Component,
  input, model,
  output,
  signal
} from '@angular/core';
import { ReadScheduleClass } from "../../interfaces/schedule-class";
import { Day } from "../../enums/day";
import { FormsModule } from "@angular/forms";
import { KeyValuePipe } from "@angular/common";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatOption } from "@angular/material/core";
import { MatSelect } from "@angular/material/select";
import {
  ScheduleGridComponent
} from "../schedule-grid/schedule-grid.component";
import {
  MatButtonToggle,
  MatButtonToggleGroup
} from "@angular/material/button-toggle";
import { MatIcon } from "@angular/material/icon";
import { MatButton } from "@angular/material/button";
import { MatMenu, MatMenuTrigger } from "@angular/material/menu";
import { MatSelectionList } from "@angular/material/list";
import { MatChipListbox, MatChipOption } from "@angular/material/chips";
import { MatSlider, MatSliderThumb } from "@angular/material/slider";

@Component({
  selector: 'csb-schedule-grid-view',
  standalone: true,
  imports: [
    FormsModule,
    KeyValuePipe,
    MatFormField,
    MatLabel,
    MatOption,
    MatSelect,
    ScheduleGridComponent,
    MatButtonToggleGroup,
    MatButtonToggle,
    MatIcon,
    MatButton,
    MatMenu,
    MatMenuTrigger,
    MatSelectionList,
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

  scheduleClasses = input<ReadScheduleClass[] | null | undefined>(null);

  shownClasses = model<string[]>([]);

  readonly classClicked = output<ReadScheduleClass>();

  timeSlotIncrement = signal(60);

  days = signal(
    Object.values(Day).filter((d) => ![Day.SATURDAY, Day.SUNDAY].includes(d)),
  );

  startTime = signal('08:00');

  endTime = signal('19:00');

  showGridOptions = signal(false);

  keepSameOrder = () => 1;
}
