import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatAnchor, MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { appRoutes } from "../../app.routes";

@Component({
  selector: 'csb-error',
  templateUrl: './error.component.html',
  styleUrl: './error.component.scss',
  standalone: true,
  imports: [MatButton, RouterLink, MatAnchor],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorComponent {
  protected readonly appRoutes = appRoutes;
}
