import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatAnchor } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { appRoutes } from "../../../app.routes";
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'csb-top-nav-bar',
  standalone: true,
  imports: [
    MatAnchor,
    RouterLink,
    MatIcon
  ],
  templateUrl: './top-nav-bar.component.html',
  styleUrl: './top-nav-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopNavBarComponent {
  protected readonly appRoutes = appRoutes;

  isSignedIn = signal(false);

  signOut() {
    console.debug('Sign out. Not yet implemented.');
  }
}
