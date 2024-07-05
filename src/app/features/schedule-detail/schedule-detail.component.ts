import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input, signal
} from '@angular/core';
import { SchedulesService } from "../../shared/services/schedules.service";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { of, switchMap } from "rxjs";
import { MatButton } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { MatIcon } from "@angular/material/icon";
import { appRoutes } from "../../app.routes";
import { MatList, MatListItem, MatListItemTitle } from "@angular/material/list";
import { MatDialog } from "@angular/material/dialog";
import {
  ScheduleClassFormDialogComponent
} from "../../shared/dialogs/schedule-class-form-dialog/schedule-class-form-dialog.component";

@Component({
  selector: 'csb-schedule-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatIcon,
    MatButton,
    MatList,
    MatListItem,
    MatListItemTitle
  ],
  templateUrl: './schedule-detail.component.html',
  styleUrl: './schedule-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleDetailComponent {
  private schedulesService = inject(SchedulesService);
  private dialog = inject(MatDialog);

  protected readonly appRoutes = appRoutes;

  scheduleId = signal<string | null>(null);

  loaded = signal(false);

  schedule = toSignal(
    toObservable(this.scheduleId).pipe(
      switchMap((scheduleId) => {
        this.loaded.set(true);

        return scheduleId ? this.schedulesService.getById$(scheduleId) : of(null);
      }),
    ),
  );

  @Input()
  set id(scheduleId: string) { this.scheduleId.set(scheduleId); }

  addClass() {
    this.dialog.open(
      ScheduleClassFormDialogComponent,
      {
        id: 'add-schedule-class-form-dialog',
      },
    );
  }
}
