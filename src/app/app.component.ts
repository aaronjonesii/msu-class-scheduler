import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  TopNavBarComponent
} from "./shared/components/top-nav-bar/top-nav-bar.component";
import { SwUpdateService } from "./shared/services/sw-update.service";

@Component({
  selector: 'csb-root',
  standalone: true,
  imports: [RouterOutlet, TopNavBarComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  private swUpdateService = inject(SwUpdateService);

  constructor() {
    this.swUpdateService.checkForSwUpdate();
  }
}
