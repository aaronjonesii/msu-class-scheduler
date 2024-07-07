import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatAnchor, MatButton } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { appRoutes } from "../../app.routes";

@Component({
  selector: 'csb-home',
  standalone: true,
  imports: [
    MatButton,
    MatAnchor,
    RouterLink
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  protected readonly appRoutes = appRoutes;
}
