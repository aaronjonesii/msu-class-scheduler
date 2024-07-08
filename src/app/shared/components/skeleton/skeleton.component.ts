import {
  ChangeDetectionStrategy,
  Component, computed, input,
} from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';

@Component({
  selector: 'csb-skeleton',
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.scss',
  standalone: true,
  imports: [NgClass, NgStyle],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  /** More details in https://angular.io/api/common/NgStyle */
  styles = input<Record<string, unknown> | null>(null);

  ariaLabel = input('loading');

  appearance = input<'circle' | 'line' | 'custom-content' | ''>('line');

  animation =
    input<'progress' | 'progress-dark' | 'pulse' | 'false' | false>('progress');

  loadingText = input('Loading...');

  /** More details in https://angular.io/api/common/NgClass */
  classes = input<Record<string, unknown> | null>(null);

  computedClasses = computed(() => {
    return {
      'custom-content': this.appearance() === 'custom-content',
      'circle': this.appearance() === 'circle',
      'progress': this.animation() === 'progress',
      'progress-dark': this.animation() === 'progress-dark',
      'pulse': this.animation() === 'pulse',
      ...(this.classes() ?? {})
    };
  });
}
