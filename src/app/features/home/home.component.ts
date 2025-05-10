import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatAnchor } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { appRoutes } from "../../app.routes";
import { MatChip } from "@angular/material/chips";

@Component({
  selector: 'csb-home',
  standalone: true,
  imports: [
    MatAnchor,
    RouterLink,
    MatChip
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  protected readonly appRoutes = appRoutes;
}
