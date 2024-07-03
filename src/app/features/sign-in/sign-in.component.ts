import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';
import { MatButton } from "@angular/material/button";
import { NgOptimizedImage } from "@angular/common";
import { MatProgressBar } from "@angular/material/progress-bar";
import { AuthService } from "../../shared/services/auth.service";
import { LoggerService } from "../../shared/services/logger.service";

@Component({
  selector: 'csb-sign-in',
  standalone: true,
  imports: [
    MatButton,
    NgOptimizedImage,
    MatProgressBar
  ],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInComponent {
  private authService = inject(AuthService);
  private logger = inject(LoggerService);

  loading = signal(false);

  async signIn() {
    try {
      this.loading.set(true);

      await this.authService.signIn();
    } catch (error: unknown) {
      this.logger.error('Error signing in.', error);
    } finally {
      this.loading.set(false);
    }
  }
}
