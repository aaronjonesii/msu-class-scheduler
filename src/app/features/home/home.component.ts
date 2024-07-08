import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatAnchor, MatButton } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { appRoutes } from "../../app.routes";
import { NgOptimizedImage } from "@angular/common";
import { MatChip } from "@angular/material/chips";

@Component({
  selector: 'csb-home',
  standalone: true,
  imports: [
    MatButton,
    MatAnchor,
    RouterLink,
    NgOptimizedImage,
    MatChip
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  protected readonly appRoutes = appRoutes;
}
