import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  COMMERCIAL_ACTIVE_DATE,
  COMMERCIAL_AVAILABILITY_METRICS,
  COMMERCIAL_ICON_ASSETS,
  COMMERCIAL_PROPERTY_CARDS,
  COMMERCIAL_RESERVATION_KPIS,
  COMMERCIAL_RESERVATIONS,
  COMMERCIAL_REVENUE_LABELS,
  COMMERCIAL_REVENUE_VALUES,
  filterReservations,
  formatDateRange,
} from '../../reservation-commercial.data';
import {
  DateRange,
  DateRangePickerComponent,
  LazyChartComponent,
} from '@ubax-workspace/shared-ui';
import { ChartData, ChartOptions, ScriptableContext, Tick } from 'chart.js';
import { ReservationKpiStripComponent } from '../../components/reservation-kpi-strip/reservation-kpi-strip.component';
import { ReservationMiniCalendarComponent } from '../../components/reservation-mini-calendar/reservation-mini-calendar.component';

@Component({
  selector: 'ubax-reservations-overview-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    DateRangePickerComponent,
    DatePipe,
    LazyChartComponent,
    ReservationKpiStripComponent,
    ReservationMiniCalendarComponent,
  ],
  templateUrl: './reservations-overview-page.component.html',
  styleUrl: './reservations-overview-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationsOverviewPageComponent {
  readonly icons = COMMERCIAL_ICON_ASSETS;
  readonly kpiCards = COMMERCIAL_RESERVATION_KPIS;
  readonly availabilityMetrics = COMMERCIAL_AVAILABILITY_METRICS;
  readonly propertyCards = COMMERCIAL_PROPERTY_CARDS;
  readonly datePickerOpen = signal(false);
  readonly selectedRange = signal<DateRange | null>(null);
  readonly searchTerm = signal('');
  readonly activeCalendarDate = COMMERCIAL_ACTIVE_DATE;

  readonly filteredReservations = computed(() =>
    filterReservations(
      COMMERCIAL_RESERVATIONS,
      this.searchTerm(),
      this.selectedRange(),
    ),
  );

  readonly previewReservations = computed(() =>
    this.filteredReservations().slice(0, 7),
  );

  readonly revenueChartData: ChartData<'line'> = {
    labels: [...COMMERCIAL_REVENUE_LABELS],
    datasets: [
      {
        data: [...COMMERCIAL_REVENUE_VALUES],
        borderColor: '#e87d1e',
        backgroundColor: (context: ScriptableContext<'line'>) => {
          const { chart } = context;
          const { chartArea, ctx } = chart;

          if (!chartArea) {
            return 'rgba(232, 125, 30, 0.18)';
          }

          const gradient = ctx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom,
          );
          gradient.addColorStop(0, 'rgba(232, 125, 30, 0.25)');
          gradient.addColorStop(1, 'rgba(232, 125, 30, 0)');

          return gradient;
        },
        fill: true,
        tension: 0.44,
        borderWidth: 3,
        pointRadius: (context) => (context.dataIndex === 3 ? 4 : 0),
        pointHoverRadius: 4,
        pointBackgroundColor: '#e87d1e',
        pointBorderWidth: 0,
      },
    ],
  };

  readonly revenueChartOptions: ChartOptions<'line'> = {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    layout: {
      padding: { top: 18, right: 50, bottom: 16, left: 14 },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: '#222222',
          font: { family: 'Lexend', size: 13, weight: 400 },
          maxRotation: 0,
        },
      },
      y: {
        min: 0,
        max: 10000000,
        border: { display: false },
        afterBuildTicks: (axis) => {
          axis.ticks = [0, 500000, 1000000, 3000000, 5000000, 10000000].map(
            (value) => ({ value }) as Tick,
          );
        },
        ticks: {
          color: '#615e83',
          font: { family: 'Inter', size: 13, weight: 400 },
          callback: (value) => {
            switch (Number(value)) {
              case 0:
                return '0';
              case 500000:
                return '500K';
              case 1000000:
                return '1M';
              case 3000000:
                return '3M';
              case 5000000:
                return '5M';
              case 10000000:
                return '10M';
              default:
                return '';
            }
          },
        },
        grid: {
          color: '#edf2f7',
          drawTicks: false,
        },
      },
    },
  };

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  onDateRangeApplied(range: DateRange): void {
    this.selectedRange.set(range);
  }

  protected rangeLabel(): string {
    const range = this.selectedRange();

    return range
      ? formatDateRange(range.start, range.end, ' - ')
      : 'Sélectionner une date';
  }

  protected availabilityTotal(): number {
    return this.availabilityMetrics.reduce(
      (total, metric) => total + metric.value,
      0,
    );
  }
}
