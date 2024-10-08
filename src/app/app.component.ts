import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  TopNavBarComponent
} from "./shared/components/top-nav-bar/top-nav-bar.component";

@Component({
  selector: 'csb-root',
  standalone: true,
  imports: [RouterOutlet, TopNavBarComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {}
