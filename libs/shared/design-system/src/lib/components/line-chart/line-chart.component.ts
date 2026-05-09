import { CommonModule } from '@angular/common';
import { Component, computed, input, model, output } from '@angular/core';

export type ChartPeriod = '7d' | 'month' | 'quarter' | 'year';

export interface ChartSeries {
  label: string;
  data: number[];
  color: string;
}

const PERIOD_OPTIONS: Array<{ label: string; value: ChartPeriod }> = [
  { label: '7 derniers jours', value: '7d' },
  { label: 'Ce mois', value: 'month' },
  { label: 'Trimestre', value: 'quarter' },
  { label: 'Année', value: 'year' },
];

@Component({
  selector: 'ubax-line-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      class="rounded-xl bg-surface-card p-6 shadow-card"
      data-ubax-motion="surface"
    >
      <div class="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 class="text-2xl font-semibold text-neutral-900">{{ title() }}</h3>
          @if (yAxisLabel()) {
            <p class="mt-1 text-md text-neutral-500">{{ yAxisLabel() }}</p>
          }
        </div>

        <div class="flex flex-wrap gap-2">
          @for (period of periodOptions; track period.value) {
            <button
              type="button"
              class="rounded-sm px-3 py-2 text-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              [class.bg-info-bg]="period.value === periodValue()"
              [class.text-brand-blue]="period.value === periodValue()"
              [class.bg-neutral-100]="period.value !== periodValue()"
              [class.text-neutral-500]="period.value !== periodValue()"
              (click)="selectPeriod(period.value)"
            >
              {{ period.label }}
            </button>
          }
        </div>
      </div>

      @if (series().length > 0 && labels().length > 0) {
        <div
          class="overflow-hidden rounded-xl border border-neutral-300 bg-neutral-50 p-4"
        >
          <svg viewBox="0 0 960 320" class="h-auto w-full">
            @for (tick of ticks(); track tick) {
              <line
                x1="48"
                x2="920"
                [attr.y1]="yPosition(tick)"
                [attr.y2]="yPosition(tick)"
                stroke="#e1e4ed"
                stroke-width="1"
              ></line>
              <text
                x="20"
                [attr.y]="yPosition(tick) + 4"
                class="fill-neutral-500 text-[12px]"
              >
                {{ tick }}
              </text>
            }

            @for (item of series(); track item.label) {
              <polyline
                [attr.points]="polylinePoints(item)"
                [attr.fill]="'none'"
                [attr.stroke]="item.color"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></polyline>

              @for (point of chartPoints(item); track $index) {
                <circle
                  [attr.cx]="point.x"
                  [attr.cy]="point.y"
                  r="4"
                  [attr.fill]="item.color"
                ></circle>
              }
            }

            @for (label of labels(); track label; let index = $index) {
              <text
                [attr.x]="labelX(index)"
                y="300"
                text-anchor="middle"
                class="fill-neutral-500 text-[12px]"
              >
                {{ label }}
              </text>
            }
          </svg>
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
export class LineChartComponent {
  readonly title = input<string>('Revenus');
  readonly series = input<ChartSeries[]>([]);
  readonly labels = input<string[]>([]);
  readonly yAxisLabel = input<string>('');

  readonly period = model<ChartPeriod>('7d');
  readonly periodChange = output<ChartPeriod>();

  readonly periodOptions = PERIOD_OPTIONS;

  readonly plotWidth = 872;
  readonly plotHeight = 240;
  readonly paddingLeft = 48;
  readonly paddingTop = 24;
  readonly paddingBottom = 48;

  readonly maxValue = computed(() => {
    const values = this.series().flatMap((item) => item.data);
    return Math.max(1, ...values);
  });

  readonly ticks = computed(() => {
    const max = this.maxValue();
    return [0.25, 0.5, 0.75, 1].map((ratio) => Math.round(max * ratio));
  });

  periodValue(): ChartPeriod {
    return this.period();
  }

  selectPeriod(value: ChartPeriod): void {
    this.period.set(value);
    this.periodChange.emit(value);
  }

  labelX(index: number): number {
    const count = Math.max(this.labels().length - 1, 1);
    return this.paddingLeft + (index / count) * this.plotWidth;
  }

  yPosition(value: number): number {
    const usableHeight = this.plotHeight;
    return (
      this.paddingTop + usableHeight - (value / this.maxValue()) * usableHeight
    );
  }

  chartPoints(item: ChartSeries): Array<{ x: number; y: number }> {
    return item.data.map((value, index) => ({
      x: this.labelX(index),
      y: this.yPosition(value),
    }));
  }

  polylinePoints(item: ChartSeries): string {
    return this.chartPoints(item)
      .map((point) => `${point.x},${point.y}`)
      .join(' ');
  }
}
