import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import type { ChartSeries } from '../line-chart/line-chart.component';

@Component({
  selector: 'ubax-bar-chart',
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
          @if (subtitle()) {
            <p class="mt-1 text-md text-neutral-500">{{ subtitle() }}</p>
          }
        </div>
      </div>

      @if (series().length > 0 && labels().length > 0) {
        <div
          class="overflow-hidden rounded-xl border border-neutral-300 bg-neutral-50 p-4"
        >
          <div class="flex items-end gap-4 overflow-x-auto pb-2">
            @for (label of labels(); track label; let index = $index) {
              <div class="flex min-w-[72px] flex-1 flex-col items-center gap-3">
                <div class="flex h-56 items-end gap-2">
                  @for (item of series(); track item.label) {
                    <div class="flex h-full w-6 items-end">
                      <div
                        class="w-full rounded-t-md"
                        [style.height.%]="barHeight(item.data[index])"
                        [style.backgroundColor]="item.color"
                        [title]="item.label + ': ' + item.data[index]"
                      ></div>
                    </div>
                  }
                </div>
                <p class="text-center text-sm text-neutral-500">{{ label }}</p>
              </div>
            }
          </div>
        </div>
      } @else {
        <div
          class="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-md text-neutral-500"
        >
          Aucune donnée à afficher.
        </div>
      }

      <div
        class="mt-4 flex flex-wrap items-center gap-4 text-md text-neutral-500"
      >
        @for (item of series(); track item.label) {
          <span class="flex items-center gap-2">
            <span
              class="size-2.5 rounded-full"
              [style.backgroundColor]="item.color"
            ></span>
            {{ item.label }}
          </span>
        }
      </div>
    </section>
  `,
})
export class BarChartComponent {
  readonly title = input<string>('Commissions vs Dépenses');
  readonly subtitle = input<string>('Comparaison des volumes par période');
  readonly series = input<ChartSeries[]>([]);
  readonly labels = input<string[]>([]);
  readonly stacked = input<boolean>(false);

  readonly maxValue = computed(() => {
    const values = this.series().flatMap((item) => item.data);
    return Math.max(1, ...values);
  });

  barHeight(value: number | undefined): number {
    const safeValue = Math.max(0, value ?? 0);
    return (safeValue / this.maxValue()) * 100;
  }
}
