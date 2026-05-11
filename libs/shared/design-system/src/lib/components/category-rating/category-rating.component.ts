import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  forwardRef,
  input,
  model,
  output,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  StarRatingComponent,
  StarRatingSize,
} from '../star-rating/star-rating.component';

/**
 * UbaxCategoryRating — Form-friendly alias around StarRating.
 */
@Component({
  selector: 'ubax-category-rating',
  standalone: true,
  imports: [CommonModule, StarRatingComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CategoryRatingComponent),
      multi: true,
    },
  ],
  template: `
    <div class="flex flex-col gap-2" data-ubax-motion="surface">
      @if (label()) {
        <label class="text-md font-medium text-neutral-900">
          {{ label() }}
          @if (required()) {
            <span class="text-brand-orange">*</span>
          }
        </label>
      }

      <ubax-star-rating
        [value]="normalizedValue()"
        [max]="max()"
        [size]="size()"
        [interactive]="true"
        [disabled]="disabled()"
        [ariaLabel]="ariaLabel()"
        (valueChange)="setValue($event)"
      />

      @if (hint()) {
        <p class="text-sm text-neutral-500">
          {{ hint() }}
        </p>
      }
    </div>
  `,
})
export class CategoryRatingComponent implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly hint = input<string>('');
  readonly max = input<number>(5);
  readonly size = input<StarRatingSize>('md');
  readonly required = input<boolean>(false);
  readonly ariaLabel = input<string>('Note de catégorie');

  readonly value = model<number | null>(null);
  readonly disabled = model<boolean>(false);
  readonly valueChange = output<number>();

  readonly normalizedValue = computed(() => this.value() ?? 0);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChange: (value: number | null) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched: () => void = () => {};

  writeValue(value: number | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  setValue(value: number): void {
    if (this.disabled()) {
      return;
    }

    this.value.set(value);
    this.onChange(value);
    this.valueChange.emit(value);
    this.onTouched();
  }
}
