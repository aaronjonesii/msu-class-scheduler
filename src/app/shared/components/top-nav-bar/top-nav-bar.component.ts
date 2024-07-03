import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatAnchor } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { appRoutes } from "../../../app.routes";

@Component({
  selector: 'csb-top-nav-bar',
  standalone: true,
  imports: [
    MatAnchor,
    RouterLink
  ],
  templateUrl: './top-nav-bar.component.html',
  styleUrl: './top-nav-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopNavBarComponent {
  protected readonly appRoutes = appRoutes;
}
