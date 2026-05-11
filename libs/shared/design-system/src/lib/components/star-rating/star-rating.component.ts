import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';

export type StarRatingSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<StarRatingSize, string> = {
  sm: 'gap-0.5 text-base',
  md: 'gap-1 text-2xl',
  lg: 'gap-1.5 text-3xl',
};

/**
 * UbaxStarRating — Display or interactive 1-5 star rating.
 */
@Component({
  selector: 'ubax-star-rating',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="inline-flex items-center"
      [class.cursor-pointer]="interactive() && !disabled()"
      [class.opacity-60]="disabled()"
      [ngClass]="sizeClasses()"
      [attr.role]="interactive() ? 'radiogroup' : 'img'"
      [attr.aria-label]="ariaLabel()"
      [attr.data-ubax-motion]="motion()"
    >
      @for (star of stars(); track star.index) {
        @if (interactive()) {
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-sm transition-colors
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            [class.text-brand-orange]="star.filled"
            [class.text-neutral-300]="!star.filled"
            [disabled]="disabled()"
            [attr.aria-pressed]="star.filled"
            [attr.aria-label]="star.index + ' étoile'"
            (click)="selectStar(star.index)"
          >
            <i [class]="star.filled ? 'pi pi-star-fill' : 'pi pi-star'"></i>
          </button>
        } @else {
          <span
            class="inline-flex items-center justify-center"
            [class.text-brand-orange]="star.filled"
            [class.text-neutral-300]="!star.filled"
            [attr.aria-hidden]="true"
          >
            <i [class]="star.filled ? 'pi pi-star-fill' : 'pi pi-star'"></i>
          </span>
        }
      }
    </div>
  `,
})
export class StarRatingComponent {
  readonly value = input<number>(0);
  readonly max = input<number>(5);
  readonly size = input<StarRatingSize>('md');
  readonly interactive = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly ariaLabel = input<string>('Note');

  readonly ratingChange = output<number>();
  readonly valueChange = output<number>();

  readonly stars = computed(() => {
    const value = Math.max(0, Math.min(this.value(), this.max()));
    return Array.from({ length: this.max() }, (_, index) => ({
      index: index + 1,
      filled: index < value,
    }));
  });

  readonly sizeClasses = computed(() => SIZE_CLASSES[this.size()]);

  readonly motion = computed(() => (this.interactive() ? 'item' : null));

  selectStar(index: number): void {
    if (!this.interactive() || this.disabled()) {
      return;
    }

    this.ratingChange.emit(index);
    this.valueChange.emit(index);
  }
}
