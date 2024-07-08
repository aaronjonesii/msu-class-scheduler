import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from "@angular/common";

@Pipe({ name: 'time', standalone: true })
export class TimePipe implements PipeTransform {
  constructor(private datePipe: DatePipe) {}

  transform(timeString: string): string {
    if (!timeString) return '';

    const [hours, minutes] = timeString.split(':');

    const dateObj = new Date();

    dateObj.setHours(Number(hours));

    dateObj.setMinutes(Number(minutes));

    return this.datePipe.transform(dateObj, 'h:mm a') || timeString;
  }
}
