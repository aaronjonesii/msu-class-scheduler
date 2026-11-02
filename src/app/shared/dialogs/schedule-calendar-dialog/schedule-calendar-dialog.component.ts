import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ReadScheduleCourse } from '../../interfaces/schedule-course';
import { downloadFile } from '../../utils/download-file';
import { scheduleCalendar } from '../../utils/schedule-calendar';

export interface ScheduleCalendarDialogContract {
  scheduleId: string,
  scheduleName: string,
  courses: ReadScheduleCourse[],
}

@Component({
  selector: 'csb-schedule-calendar-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatButton,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatFormField,
    MatInput,
    MatLabel,
  ],
  templateUrl: './schedule-calendar-dialog.component.html',
  styleUrl: './schedule-calendar-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleCalendarDialogComponent {
  private contract = inject<ScheduleCalendarDialogContract>(MAT_DIALOG_DATA);
  private document = inject(DOCUMENT);

  firstDay = signal('');
  lastDay = signal('');
  breakStart = signal('');
  breakEnd = signal('');

  dateError = computed(() => {
    const [firstDay, lastDay, breakStart, breakEnd] = [this.firstDay(), this.lastDay(), this.breakStart(), this.breakEnd()];

    if (firstDay && lastDay && lastDay < firstDay) return 'The last day must be on or after the first day.';

    if (Boolean(breakStart) !== Boolean(breakEnd)) return 'Fill in both break dates, or neither.';

    return breakEnd < breakStart ? 'The break must end on or after it starts.' : null;
  });

  calendar = computed(() => {
    if (!this.firstDay() || !this.lastDay() || this.dateError()) return null;

    const { scheduleId, courses } = this.contract;
    const dates = {
      firstDay: this.firstDay(),
      lastDay: this.lastDay(),
      breakStart: this.breakStart(),
      breakEnd: this.breakEnd(),
    };

    return scheduleCalendar(scheduleId, courses, dates, new Date());
  });

  download() {
    const ics = this.calendar()?.ics;

    if (!ics) return;

    const fileName = this.contract.scheduleName.replace(/[^\w -]/g, '').trim() || 'schedule';

    downloadFile(this.document, `${fileName}.ics`, 'text/calendar;charset=utf-8', ics);
  }
}
