import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { SchedulesService } from "../../shared/services/schedules.service";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatNavList } from "@angular/material/list";
import { MatMenuItem } from "@angular/material/menu";
import { AuthService } from "../../shared/services/auth.service";
import { of, switchMap } from "rxjs";

@Component({
  selector: 'csb-schedules',
  standalone: true,
  imports: [
    MatNavList,
    MatMenuItem
  ],
  templateUrl: './schedules.component.html',
  styleUrl: './schedules.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulesComponent {
  private schedulesService = inject(SchedulesService);
  private authService = inject(AuthService);

  schedules = toSignal(
    this.authService.authState$().pipe(
      switchMap((user) => {
        return user ? this.schedulesService.getByUser$(user.uid) : of([]);
      }),
    ),
  );
}
