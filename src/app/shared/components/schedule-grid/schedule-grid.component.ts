import {
  ChangeDetectionStrategy,
  Component,
  computed, HostBinding,
  input, model, output,
} from '@angular/core';
import { Day } from "../../enums/day";
import { NgClass, NgStyle } from "@angular/common";
import {
  ReadScheduleClass, ScheduleClass,
} from "../../interfaces/schedule-class";
import { ColorToClassPipe } from "../../pipes/color-to-class.pipe";
import { Color, DefaultColor } from "../../enums/color";
import { dateDifference } from "../../utils/date-difference";
import { MatMenu, MatMenuItem, MatMenuTrigger } from "@angular/material/menu";
import { ScheduleClassStatus } from "../../enums/schedule-class-status";
import { MatChip } from "@angular/material/chips";
import { MatTooltip } from "@angular/material/tooltip";
import { ScheduleClassMeeting } from "../../interfaces/schedule-class-meeting";
import {
  ScheduleClassMeetingTime
} from "../../interfaces/schedule-class-meeting-time";

export interface GridTile {
  id: string,
  name: string,
  description?: string,
  times?: string,
  location?: string,
  instructor?: string,
  color: Color,
  scheduleClass?: ReadScheduleClass,
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

@Component({
  selector: 'csb-schedule-grid',
  standalone: true,
  imports: [
    NgStyle, ColorToClassPipe, MatMenu, MatMenuItem,
    MatMenuTrigger, MatChip, MatTooltip, NgClass,
  ],
  templateUrl: './schedule-grid.component.html',
  styleUrl: './schedule-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleGridComponent {
  protected readonly ScheduleClassStatus = ScheduleClassStatus;

  @HostBinding('style.gridTemplateColumns')
  get gridTemplateColumns() {
    return `repeat(${this.days().length + 1}, minmax(100px, 1fr))`;
  }

  @HostBinding('style.gridTemplateRows')
  get gridTemplateRows() {
    const numTimeSlots = this.numTimeSlots();

    return `${this.firstRowHeight()}px repeat(${numTimeSlots}, minmax(${this.rowHeight()}px, 1fr))`;
  }

  firstRowHeight = input(100);

  rowHeight = input(100);

  days = input(Object.values(Day));

  times = input<GridTimes>({start: '08:00', end: '21:00'});

  scheduleClasses = input<ReadScheduleClass[]>([]);

  shownClasses = model<string[]>([]);

  dayTileColor = input(Color.SPRING_GREEN);

  timeTileColor = input(Color.ORANGE);

  timeSlotIncrement = input(60);

  readonly classClicked = output<ReadScheduleClass>();

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
      };
    });
  });

  numTimeSlots = computed(() => {
    const { start, end } = this.times();

    const totalMinutes = this._differenceInMinutes(start, end);

    return totalMinutes / this.timeSlotIncrement();
  });

  timeTiles = computed<GridTile[]>(() => {
    const numSlots = this.numTimeSlots()

    const tiles: GridTile[] = [];

    const start = this._parseTime(this.times().start);

    const incrementMinutes = this.timeSlotIncrement();

    for (let i = 0; i < numSlots; i++) {
      const startTime = new Date(start.getTime() + i * incrementMinutes * 60 * 1000);

      tiles.push({
        id: startTime.toLocaleTimeString(),
        name: this._formatTime(startTime),
        color: this.timeTileColor(),
        styles: {
          gridColumnStart: 1,
          gridColumnEnd: 2,
          gridRowStart: i + 2,
          gridRowEnd: i + 3,
        },
      });
    }

    return tiles;
  });

  classTiles = computed<GridTile[]>(() => {
    const tiles: GridTile[] = [];

    const nextAvailableRow: { [day: string]: number } = {};

    this.days().map((day) => nextAvailableRow[day] = this.numTimeSlots() + 2);

    for (const scheduleClass of this.scheduleClasses()) {
      if (!this.shownClasses().includes(scheduleClass.id)) continue;

      for (const meeting of scheduleClass.meetings) {
        let hasMeetingTimes = false;

        hasMeetingTimes = !!meeting.meetingTimes.length;

        if (hasMeetingTimes) {
          for (const time of meeting.meetingTimes) {
            for (const day of time.days) {
              let dayIndex = this.days().indexOf(day);

              const startTime = this._parseTime(time.startTime);

              let startRow = this._getGridRowFromTime(startTime);

              const endTime = this._parseTime(time.endTime);

              let endRow = this._getGridRowFromTime(endTime);

              tiles.push({
                id: `${scheduleClass.id}-${meeting.type}-${day}-${time.startTime}`,
                name: scheduleClass.name,
                description: meeting.type,
                times: `${this._formatTime(startTime)} - ${this._formatTime(endTime)}`,
                color: scheduleClass.color || DefaultColor,
                scheduleClass: scheduleClass,
                styles: {
                  /** +2 to account for the time column and label column */
                  gridColumnStart: dayIndex + 2,
                  /** +1 for the single column span */
                  gridColumnEnd: dayIndex + 2 + 1,
                  gridRowStart: startRow,
                  gridRowEnd: endRow + 1,
                },
              });
            }
          }
        } else {
          for (const day of this.days()) {
            const startRow = nextAvailableRow[day];

            const endRow = nextAvailableRow[day] + 1;

            const dayIndex = this.days().indexOf(day);

            tiles.push({
              id: `${scheduleClass.id}-${meeting.type}-${day}-TBA`,
              name: scheduleClass.name,
              description: meeting.type,
              times: 'To Be Announced',
              color: scheduleClass.color || DefaultColor,
              scheduleClass: scheduleClass,
              styles: {
                /** +2 to account for the time column and label column */
                gridColumnStart: dayIndex + 2,
                /** +1 for the single column span */
                gridColumnEnd: dayIndex + 2 + 1,
                gridRowStart: startRow,
                gridRowEnd: endRow,
              },
            });

            nextAvailableRow[day]++;
          }
        }
      }
    }

    return tiles;
  });

  private _differenceInMinutes(start: string, end: string) {
    const [startHour, startMinute] = start.split(':').map(Number);

    const [endHour, endMinute] = end.split(':').map(Number);

    return (endHour - startHour) * 60 + (endMinute - startMinute);
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

  private _getGridRowFromTime(time: Date): number {
    const start = this._parseTime(this.times().start);

    /** Ensure the time is within the grid's time range */
    if (time.getTime() < start.getTime()) {
      /** Default to the first available row */
      return 2;
    }

    const minutesDiff = dateDifference(time, start, 'minutes');

    const slotsDiff = minutesDiff / this.timeSlotIncrement();

    /** +2 to account for the label row and the first time slow row */
    return Math.floor(slotsDiff) + 2;
  }
}
