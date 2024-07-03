import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButton } from "@angular/material/button";
import { NgOptimizedImage } from "@angular/common";
import { MatProgressBar } from "@angular/material/progress-bar";

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
  loading = signal(false);

  signIn() {
    try {
      this.loading.set(true);
      console.debug('Sign in with google. Not yet implemented.');
    } catch (error: unknown) {
      console.error('Error signing in.', error);
    } finally {
      this.loading.set(false);
    }
  }
}
