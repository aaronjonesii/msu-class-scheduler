import {
  ChangeDetectionStrategy,
  Component,
  computed, HostBinding,
  input
} from '@angular/core';
import { Day } from "../../enums/day";
import { NgStyle } from "@angular/common";
import {
  ReadScheduleClass,
  ScheduleClass
} from "../../interfaces/schedule-class";
import { ColorToClassPipe } from "../../pipes/color-to-class.pipe";
import { Color, DefaultColor } from "../../enums/color";

export interface GridTile {
  id: string,
  name: string,
  description?: string,
  times?: string,
  color: Color,
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
  imports: [NgStyle, ColorToClassPipe],
  templateUrl: './schedule-grid.component.html',
  styleUrl: './schedule-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleGridComponent {
  @HostBinding('style.gridTemplateColumns')
  get gridTemplateColumns() {
    return `repeat(${this.days().length + 1}, 1fr)`;
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

  dayTileColor = input(Color.SPRING_GREEN);

  timeTileColor = input(Color.ORANGE);

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

  timeSlotIncrement = input(60);

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

    for (const scheduleClass of this.scheduleClasses()) {
      for (const meeting of scheduleClass.meetings) {
        for (const time of meeting.meetingTimes) {
          for (const day of time.days) {
            const dayIndex = this.days().indexOf(day);

            if (dayIndex === -1) continue;

            const startTime = this._parseTime(time.startTime);

            const startRow = this._getGridRowFromTime(startTime);

            const endTime = this._parseTime(time.endTime);

            const endRow = this._getGridRowFromTime(endTime);

            tiles.push({
              id: `${scheduleClass.id}-${meeting.type}-${day}-${time.startTime}`,
              name: scheduleClass.name,
              description: meeting.type,
              times: `${this._formatTime(startTime)} - ${this._formatTime(endTime)}`,
              color: scheduleClass.color || DefaultColor,
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

    const minutesDiff = this._getDateDifference(time, start, 'minutes');

    const slotsDiff = minutesDiff / this.timeSlotIncrement();

    /** +2 to account for the label row and the first time slow row */
    return Math.floor(slotsDiff) + 2;
  }

  private _getDateDifference(
    date1: Date,
    date2: Date,
    unit: 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' = 'days',
  ): number {
    const diffInMilliseconds = Math.abs(date1.getTime() - date2.getTime());

    switch (unit) {
      case 'milliseconds':
        return diffInMilliseconds;
      case 'seconds':
        return diffInMilliseconds / 1000;
      case 'minutes':
        return diffInMilliseconds / (1000 * 60);
      case 'hours':
        return diffInMilliseconds / (1000 * 60 * 60);
      case 'days':
        return diffInMilliseconds / (1000 * 60 * 60 * 24);
    }
  }
}
