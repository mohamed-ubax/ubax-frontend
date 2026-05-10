import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutSegment extends DonutSlice {
  percent: number;
  dashOffset: number;
}

@Component({
  selector: 'ubax-donut-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      class="rounded-xl bg-surface-card p-6 shadow-card"
      data-ubax-motion="surface"
    >
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 class="text-2xl font-semibold text-neutral-900">{{ title() }}</h3>
          @if (centerLabel()) {
            <p class="mt-1 text-md text-neutral-500">{{ centerLabel() }}</p>
          }
        </div>

        <div class="flex items-center gap-3 text-sm text-neutral-500">
          @for (slice of slices(); track slice.label) {
            <span class="flex items-center gap-2">
              <span
                class="size-2.5 rounded-full"
                [style.backgroundColor]="slice.color"
              ></span>
              {{ slice.label }}
            </span>
          }
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-center">
        <div class="relative mx-auto size-[220px] max-w-full">
          <svg viewBox="0 0 160 160" class="size-full -rotate-90">
            <circle
              cx="80"
              cy="80"
              [attr.r]="radius()"
              fill="none"
              stroke="#ecf2f7"
              [attr.stroke-width]="strokeWidth()"
            ></circle>

            @for (segment of segments(); track segment.label) {
              <circle
                cx="80"
                cy="80"
                [attr.r]="radius()"
                fill="none"
                [attr.stroke]="segment.color"
                [attr.stroke-width]="strokeWidth()"
                stroke-linecap="round"
                [attr.stroke-dasharray]="dashArray(segment.percent)"
                [attr.stroke-dashoffset]="dashOffset(segment.dashOffset)"
              ></circle>
            }
          </svg>

          <div
            class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
          >
            <p class="text-md text-neutral-500">{{ centerLabel() }}</p>
            <p class="mt-1 text-4xl font-semibold text-neutral-900">
              {{ centerValue() }}
            </p>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          @for (slice of segments(); track slice.label) {
            <div class="rounded-xl border border-neutral-300 p-4">
              <div class="flex items-center justify-between gap-3">
                <div class="flex min-w-0 items-center gap-2">
                  <span
                    class="size-2.5 rounded-full"
                    [style.backgroundColor]="slice.color"
                  ></span>
                  <p class="truncate text-md font-medium text-neutral-900">
                    {{ slice.label }}
                  </p>
                </div>
                <p class="text-md font-semibold text-neutral-900">
                  {{ slice.value }}
                </p>
              </div>
              <p class="mt-2 text-sm text-neutral-500">
                {{ slice.percent | number: '1.0-0' }}%
              </p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class DonutChartComponent {
  readonly title = input<string>('Réservations par type');
  readonly slices = input<DonutSlice[]>([]);
  readonly centerLabel = input<string>('Total');
  readonly centerValue = input<string | number>('0');

  readonly radius = input<number>(54);
  readonly strokeWidth = input<number>(18);

  readonly total = computed(() =>
    this.slices().reduce((sum, slice) => sum + Math.max(slice.value, 0), 0),
  );

  readonly segments = computed<DonutSegment[]>(() => {
    const total = this.total();
    let cursor = 0;

    return this.slices()
      .filter((slice) => slice.value > 0)
      .map((slice) => {
        const percent = total > 0 ? slice.value / total : 0;
        const segment = {
          ...slice,
          percent,
          dashOffset: cursor,
        };
        cursor += percent;
        return segment;
      });
  });

  dashArray(percent: number): string {
    const circumference = 2 * Math.PI * this.radius();
    return `${circumference * percent} ${circumference}`;
  }

  dashOffset(percentOffset: number): string {
    const circumference = 2 * Math.PI * this.radius();
    return `${-circumference * percentOffset}`;
  }
}
