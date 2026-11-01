import {
  ChangeDetectionStrategy,
  Component,
  computed, HostBinding,
  input, model, output,
} from '@angular/core';
import { Day } from "../../enums/day";
import { NgClass, NgStyle } from "@angular/common";
import {
  ReadScheduleCourse,
} from "../../interfaces/schedule-course";
import { ColorToClassPipe } from "../../pipes/color-to-class.pipe";
import { Color, DefaultColor } from "../../enums/color";
import { noMeetingTimeLabel } from "../../utils/no-meeting-time-label";
import { ScheduleCourseStatus } from "../../enums/schedule-course-status";
import { MatChip } from "@angular/material/chips";
import { MatTooltip } from "@angular/material/tooltip";
import { ScheduleCourseMeeting } from '../../interfaces/schedule-course-meeting';

export interface GridTile {
  id: string,
  name: string,
  times?: string,
  color?: Color,
  meeting?: ScheduleCourseMeeting,
  scheduleCourse?: ReadScheduleCourse,
  styles: {
    gridColumnStart: number,
    gridColumnEnd: number,
    gridRowStart: number,
    gridRowEnd: number,
  },
}

export interface GridTimes {
  start: string,
  end: string,
}

/** Rows are this short so a class sits at its real time. Hour labels span several. */
const MINUTES_PER_ROW = 5;

/** +2 because grid lines count from 1 and the first row holds the day labels. */
const rowAtMinutes = (minutes: number) => Math.round(minutes / MINUTES_PER_ROW) + 2;

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);

  return hours * 60 + minutes;
}

@Component({
  selector: 'csb-schedule-grid',
  standalone: true,
  imports: [
    NgStyle, ColorToClassPipe,
    MatChip, MatTooltip, NgClass,
  ],
  templateUrl: './schedule-grid.component.html',
  styleUrl: './schedule-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleGridComponent {
  protected readonly ScheduleCourseStatus = ScheduleCourseStatus;

  @HostBinding('style.gridTemplateColumns')
  get gridTemplateColumns() {
    return `72px repeat(${this.days().length}, minmax(120px, 1fr))`;
  }

  @HostBinding('style.--slot-height')
  get slotHeight() {
    return `${this.rowHeight()}px`;
  }

  @HostBinding('style.--header-height')
  get headerHeight() {
    return `${this.firstRowHeight()}px`;
  }

  @HostBinding('style.gridTemplateRows')
  get gridTemplateRows() {
    const fixedRowHeight = this.rowHeight() * MINUTES_PER_ROW / this.timeSlotIncrement();

    return `${this.firstRowHeight()}px repeat(${this.numRows()}, ${fixedRowHeight}px)`;
  }

  firstRowHeight = input(40);

  rowHeight = input(72);

  days = input(Object.values(Day));

  times = input<GridTimes>({start: '08:00', end: '21:00'});

  scheduleCourses = input<ReadScheduleCourse[]>([]);

  shownCourses = model<string[]>([]);

  dayTileColor = input(Color.SPRING_GREEN);

  timeSlotIncrement = input(60);

  readonly courseClicked = output<ReadScheduleCourse>();

  dayTiles = computed<GridTile[]>(() => {
    return this.days().map((day, i) => {
      const gridColumnStart = (i + 1) + 1;
      return {
        id: day,
        name: day,
        color: this.dayTileColor(),
        styles: {
          gridColumnStart,
          gridColumnEnd: gridColumnStart + 1,
          gridRowStart: 1,
          gridRowEnd: 2,
        },
      } satisfies GridTile;
    });
  });

  totalMinutes = computed(() => {
    const { start, end } = this.times();

    return toMinutes(end) - toMinutes(start);
  });

  numRows = computed(() => Math.ceil(this.totalMinutes() / MINUTES_PER_ROW));

  timeTiles = computed<GridTile[]>(() => {
    const tiles: GridTile[] = [];

    const start = this._parseTime(this.times().start);

    const incrementMinutes = this.timeSlotIncrement();

    for (let i = 0; i * incrementMinutes < this.totalMinutes(); i++) {
      const startTime = new Date(start.getTime() + i * incrementMinutes * 60 * 1000);

      tiles.push({
        id: startTime.toLocaleTimeString(),
        name: this._formatTime(startTime),
        styles: {
          gridColumnStart: 1,
          gridColumnEnd: 2,
          gridRowStart: rowAtMinutes(i * incrementMinutes),
          gridRowEnd: rowAtMinutes((i + 1) * incrementMinutes),
        },
      });
    }

    return tiles;
  });

  courseTiles = computed<GridTile[]>(() => {
    const tiles: GridTile[] = [];

    const noTimeTiles: GridTile[] = [];

    for (const scheduleCourse of this.scheduleCourses()) {
      if (!this.shownCourses().includes(scheduleCourse.id)) continue;

      for (const meeting of scheduleCourse.meetings) {
        const tile = {
          name: scheduleCourse.name,
          color: scheduleCourse?.color ?? DefaultColor,
          meeting,
          scheduleCourse,
        };

        if (meeting.meetingTimes.length === 0) {
          noTimeTiles.push({
            ...tile,
            id: `${scheduleCourse.id}-${meeting.type}-no-time`,
            times: noMeetingTimeLabel(meeting),
            styles: {
              /** A class with no set time isn't on any one day, so it spans them all. */
              gridColumnStart: 2,
              gridColumnEnd: this.days().length + 2,
              /** Rows are set below, once every timed class has its place. */
              gridRowStart: 0,
              gridRowEnd: 0,
            },
          });
        }

        for (const time of meeting.meetingTimes) {
          for (const day of time.days) {
            const dayIndex = this.days().indexOf(day);

            const startRow = this._rowAtTime(time.startTime);

            tiles.push({
              ...tile,
              id: `${scheduleCourse.id}-${meeting.type}-${day}-${time.startTime}`,
              times: `${this._formatTime(this._parseTime(time.startTime))} - ${this._formatTime(this._parseTime(time.endTime))}`,
              styles: {
                /** +2 to account for the time column and label column */
                gridColumnStart: dayIndex + 2,
                /** +1 for the single column span */
                gridColumnEnd: dayIndex + 2 + 1,
                gridRowStart: startRow,
                gridRowEnd: Math.max(this._rowAtTime(time.endTime), startRow + 1),
              },
            });
          }
        }
      }
    }

    /** Below the grid, and below any evening class that runs past the end of it. */
    const firstFreeRow = Math.max(this.numRows() + 2, ...tiles.map((t) => t.styles.gridRowEnd));

    noTimeTiles.forEach((tile, index) => {
      tile.styles.gridRowStart = firstFreeRow + index;
      tile.styles.gridRowEnd = firstFreeRow + index + 1;
    });

    return [...tiles, ...noTimeTiles];
  });

  /** Short tiles only have room for the course, time and room. */
  tileDetails({ name, meeting }: GridTile): string {
    return [name, meeting?.type, meeting?.instructor].filter(Boolean).join(', ');
  }

  private _rowAtTime(time: string): number {
    return rowAtMinutes(Math.max(0, toMinutes(time) - toMinutes(this.times().start)));
  }

  private _parseTime(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);

    const date = new Date();

    date.setHours(hours, minutes);

    return date;
  }

  private _formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
