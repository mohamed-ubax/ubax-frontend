import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import type {
  Chart as ChartInstance,
  ChartConfiguration,
  ChartType,
} from 'chart.js';

@Component({
  selector: 'ubax-lazy-chart',
  standalone: true,
  template: `
    <div
      class="p-chart"
      [style.width]="width() || null"
      [style.height]="height() || null"
    >
      <canvas
        #canvas
        [attr.aria-label]="ariaLabel() || null"
        [attr.role]="ariaLabel() ? 'img' : null"
      ></canvas>
    </div>
  `,
  styleUrl: './lazy-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LazyChartComponent implements AfterViewInit, OnDestroy {
  readonly type = input.required<ChartType>();
  readonly data = input.required<unknown>();
  readonly options = input<unknown>(undefined);
  readonly plugins = input<unknown[] | undefined>(undefined);
  readonly width = input<string | undefined>(undefined);
  readonly height = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined);

  private readonly platformId = inject(PLATFORM_ID);
  private readonly canvasRef =
    viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly viewReady = signal(false);
  private readonly chartModulePromise = import('chart.js/auto');
  private chart: ChartInstance | null = null;
  private renderToken = 0;

  constructor() {
    effect(() => {
      const ready = this.viewReady();
      const type = this.type();
      const data = this.data();
      const options = this.options();
      const plugins = this.plugins();

      if (!ready) {
        return;
      }

      void this.renderChart(type, data, options, plugins);
    });
  }

  ngAfterViewInit(): void {
    this.viewReady.set(true);
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  private async renderChart(
    type: ChartType,
    data: unknown,
    options?: unknown,
    plugins?: unknown[],
  ): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const currentToken = ++this.renderToken;
    const { default: Chart } = await this.chartModulePromise;

    if (currentToken !== this.renderToken) {
      return;
    }

    const configuration: ChartConfiguration = {
      type,
      data: data as ChartConfiguration['data'],
      options: options as ChartConfiguration['options'],
      plugins: plugins as ChartConfiguration['plugins'],
    };

    this.destroyChart();
    this.chart = new Chart(this.canvasRef().nativeElement, configuration);
    this.chart.resize();
  }

  private destroyChart(): void {
    if (!this.chart) {
      return;
    }

    this.chart.destroy();
    this.chart = null;
  }
}
