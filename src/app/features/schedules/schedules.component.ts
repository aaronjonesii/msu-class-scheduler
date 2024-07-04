import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'csb-schedules',
  standalone: true,
  imports: [],
  templateUrl: './schedules.component.html',
  styleUrl: './schedules.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulesComponent {}
