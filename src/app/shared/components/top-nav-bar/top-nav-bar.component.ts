import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { MatAnchor } from "@angular/material/button";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { appRoutes } from "../../../app.routes";
import { MatIcon } from "@angular/material/icon";
import { AuthService } from "../../services/auth.service";
import { toSignal } from "@angular/core/rxjs-interop";
import { map } from "rxjs";
import { SkeletonComponent } from "../skeleton/skeleton.component";
import { NgOptimizedImage } from "@angular/common";

@Component({
  selector: 'csb-top-nav-bar',
  standalone: true,
  imports: [
    MatAnchor,
    RouterLink,
    MatIcon,
    SkeletonComponent,
    RouterLinkActive,
    NgOptimizedImage
  ],
  templateUrl: './top-nav-bar.component.html',
  styleUrl: './top-nav-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopNavBarComponent {
  protected readonly appRoutes = appRoutes;

  private authService = inject(AuthService);


  isSignedIn$ = this.authService.authState$().pipe(
    map((user) => !!user),
  );

  isSignedIn = toSignal(this.isSignedIn$);

  async signOut() {
    await this.authService.signOut();
  }
}
