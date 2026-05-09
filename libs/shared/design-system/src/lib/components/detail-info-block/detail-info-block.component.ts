import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

export interface InfoItem {
  label: string;
  value: string;
  icon?: string;
}

const COLUMNS_CLASSES: Record<1 | 2 | 3 | 4, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
};

@Component({
  selector: 'ubax-detail-info-block',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="overflow-hidden rounded-xl shadow-card"
      [class.bg-neutral-300]="bordered()"
      [class.bg-surface-card]="!bordered()"
      data-ubax-motion="surface"
    >
      <div
        [class]="wrapperClasses()"
        [class.gap-px]="bordered()"
        [class.bg-neutral-300]="bordered()"
      >
        @for (item of items(); track item.label; let index = $index) {
          <div
            class="min-w-0 p-6"
            [class.bg-surface-card]="bordered()"
            [class.border-b]="!bordered() && hasBottomBorder(index)"
            [class.border-r]="!bordered() && hasRightBorder(index)"
            [class.border-neutral-300]="!bordered()"
          >
            <div class="flex items-start gap-3">
              @if (item.icon) {
                <span
                  class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-info-bg text-brand-blue"
                >
                  <i [class]="item.icon"></i>
                </span>
              }

              <div class="min-w-0">
                <p class="text-md font-regular text-neutral-500">
                  {{ item.label }}
                </p>
                <p
                  class="mt-1 text-md font-medium text-neutral-900 break-words"
                >
                  {{ item.value }}
                </p>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class DetailInfoBlockComponent {
  readonly items = input.required<InfoItem[]>();
  readonly columns = input<1 | 2 | 3 | 4>(2);
  readonly bordered = input<boolean>(true);

  readonly wrapperClasses = computed(
    () => `grid ${COLUMNS_CLASSES[this.columns()]}`,
  );

  hasRightBorder(index: number): boolean {
    return (index + 1) % this.columns() !== 0;
  }

  hasBottomBorder(index: number): boolean {
    const rowLength = this.columns();
    const totalItems = this.items().length;
    return index < totalItems - rowLength;
  }
}
