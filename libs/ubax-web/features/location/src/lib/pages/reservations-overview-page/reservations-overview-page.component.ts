import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChartData, ChartOptions, Plugin } from 'chart.js';
import { ChartModule } from 'primeng/chart';
import {
  CommercialReservation,
  COMMERCIAL_ACTIVE_DATE,
  COMMERCIAL_ICON_ASSETS,
  COMMERCIAL_PROPERTY_CARDS,
  COMMERCIAL_RESERVATIONS,
  COMMERCIAL_REVENUE_SERIES,
  ReservationAvailabilityMetric,
  ReservationPropertyCard,
  buildCommercialReservationKpis,
  filterReservations,
  formatDateRange,
  formatFcfa,
  resolveCommercialOverviewSnapshot,
} from '../../reservation-commercial.data';
import { DateRange, DateRangePickerComponent } from '@ubax-workspace/shared-ui';
import { ReservationKpiStripComponent } from '../../components/reservation-kpi-strip/reservation-kpi-strip.component';
import { ReservationMiniCalendarComponent } from '../../components/reservation-mini-calendar/reservation-mini-calendar.component';

type OverviewPropertyCard = ReservationPropertyCard & {
  readonly reservationId: string;
};

const AVAILABILITY_COLORS: Record<
  ReservationAvailabilityMetric['tone'],
  string
> = {
  green: '#16b55b',
  orange: '#e87d1e',
  blue: '#008bff',
  red: '#fa191d',
};

function isSameMonth(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth()
  );
}

function buildActiveRevenuePlugin(activeIndex: number): Plugin<'line'> {
  return {
    id: `ubaxCommercialRevenueActivePoint-${activeIndex}`,
    afterDatasetsDraw(chart) {
      const activePoint = chart.getDatasetMeta(0).data[activeIndex];

      if (!activePoint) {
        return;
      }

      const { ctx, chartArea } = chart;

      ctx.save();
      ctx.strokeStyle = '#e87d1e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(activePoint.x, activePoint.y + 14);
      ctx.lineTo(activePoint.x, chartArea.bottom - 8);
      ctx.stroke();

      ctx.fillStyle = '#e87d1e';
      ctx.beginPath();
      ctx.arc(activePoint.x, activePoint.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
  };
}

@Component({
  selector: 'ubax-reservations-overview-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    DateRangePickerComponent,
    DatePipe,
    ChartModule,
    ReservationKpiStripComponent,
    ReservationMiniCalendarComponent,
  ],
  templateUrl: './reservations-overview-page.component.html',
  styleUrl: './reservations-overview-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationsOverviewPageComponent {
  readonly icons = COMMERCIAL_ICON_ASSETS;
  readonly reservations = signal([...COMMERCIAL_RESERVATIONS]);
  readonly datePickerOpen = signal(false);
  readonly selectedRange = signal<DateRange | null>(null);
  readonly searchTerm = signal('');
  readonly activeCalendarDate = COMMERCIAL_ACTIVE_DATE;

  readonly overviewSnapshot = computed(() =>
    resolveCommercialOverviewSnapshot(this.selectedRange()),
  );

  readonly kpiCards = computed(() =>
    buildCommercialReservationKpis(this.overviewSnapshot()),
  );

  readonly availabilityMetrics = computed(
    () => this.overviewSnapshot().availability,
  );

  readonly filteredReservations = computed(() =>
    filterReservations(
      this.reservations(),
      this.searchTerm(),
      this.selectedRange(),
    ),
  );

  readonly previewReservations = computed(() =>
    this.filteredReservations().slice(0, 7),
  );

  readonly propertyCards = computed<readonly OverviewPropertyCard[]>(() => {
    const sourceReservations =
      this.filteredReservations().length > 0
        ? this.filteredReservations()
        : this.reservations();

    return COMMERCIAL_PROPERTY_CARDS.map((card, index) => {
      const reservation =
        sourceReservations[index] ??
        COMMERCIAL_RESERVATIONS[index % COMMERCIAL_RESERVATIONS.length];

      return {
        ...card,
        reservationId: reservation.id,
        title: reservation.property,
        location: reservation.propertyLocation,
        tenantName: reservation.tenantName,
        tenantRole: reservation.tenantRole,
        avatar: reservation.guestImage,
      };
    });
  });

  readonly activeRevenueIndex = computed(() => {
    const snapshotMonth = this.overviewSnapshot().month;
    const matchedIndex = COMMERCIAL_REVENUE_SERIES.findIndex((point) =>
      isSameMonth(point.month, snapshotMonth),
    );

    return Math.max(matchedIndex, 0);
  });

  readonly activeRevenueLabel = computed(() =>
    formatFcfa(
      COMMERCIAL_REVENUE_SERIES[this.activeRevenueIndex()]?.value ?? 0,
    ),
  );

  readonly activeRevenueOffset = computed(() => {
    const firstPointOffset = 9;
    const lastPointOffset = 92;
    const pointCount = Math.max(COMMERCIAL_REVENUE_SERIES.length - 1, 1);

    return `${
      firstPointOffset +
      ((lastPointOffset - firstPointOffset) * this.activeRevenueIndex()) /
        pointCount
    }%`;
  });

  readonly availabilityChartData = computed<ChartData<'bar'>>(() => ({
    labels: ['Disponibilité'],
    datasets: this.availabilityMetrics().map((metric, index, metrics) => ({
      label: metric.label,
      data: [metric.share],
      backgroundColor: AVAILABILITY_COLORS[metric.tone],
      borderColor: AVAILABILITY_COLORS[metric.tone],
      borderWidth: 0,
      borderSkipped: false,
      borderRadius: {
        topLeft: index === 0 ? 5 : 0,
        bottomLeft: index === 0 ? 5 : 0,
        topRight: index === metrics.length - 1 ? 5 : 0,
        bottomRight: index === metrics.length - 1 ? 5 : 0,
      },
      barThickness: 86,
      categoryPercentage: 1,
      barPercentage: 1,
      stack: 'availability',
    })),
  }));

  readonly availabilityChartOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 450 },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    layout: {
      padding: 0,
    },
    scales: {
      x: {
        stacked: true,
        display: false,
        min: 0,
        max: 100,
        border: { display: false },
        grid: { display: false, drawTicks: false },
      },
      y: {
        stacked: true,
        display: false,
        border: { display: false },
        grid: { display: false, drawTicks: false },
      },
    },
  };

  readonly revenueChartData = computed<ChartData<'line'>>(() => ({
    labels: COMMERCIAL_REVENUE_SERIES.map((point) => point.label),
    datasets: [
      {
        data: COMMERCIAL_REVENUE_SERIES.map((point) => point.value),
        borderColor: '#e87d1e',
        backgroundColor: (context) => {
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
          gradient.addColorStop(0, 'rgba(232, 125, 30, 0.28)');
          gradient.addColorStop(0.62, 'rgba(232, 125, 30, 0.12)');
          gradient.addColorStop(1, 'rgba(232, 125, 30, 0)');

          return gradient;
        },
        fill: true,
        tension: 0.44,
        borderWidth: 3,
        pointRadius: COMMERCIAL_REVENUE_SERIES.map((_, index) =>
          index === this.activeRevenueIndex() ? 4 : 0,
        ),
        pointHoverRadius: COMMERCIAL_REVENUE_SERIES.map((_, index) =>
          index === this.activeRevenueIndex() ? 4 : 0,
        ),
        pointBackgroundColor: '#e87d1e',
        pointBorderWidth: 0,
      },
    ],
  }));

  readonly revenueChartPlugins = computed(() => [
    buildActiveRevenuePlugin(this.activeRevenueIndex()),
  ]);

  readonly revenueChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 650 },
    interaction: { intersect: false, mode: undefined },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    layout: {
      padding: { top: 20, right: 18, bottom: 12, left: 4 },
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
        afterBuildTicks: (axis) => {
          axis.ticks = [0, 500000, 1000000, 3000000, 5000000, 10000000].map(
            (value) => ({ value }),
          );
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

  protected confirmReservation(reservationId: string): void {
    this.reservations.update((reservations) =>
      reservations.map((reservation) => {
        if (
          reservation.id !== reservationId ||
          reservation.status === 'Confirmé'
        ) {
          return reservation;
        }

        return {
          ...reservation,
          status: 'Confirmé',
          tone: 'success',
        };
      }),
    );
  }

  protected confirmLabel(reservation: CommercialReservation): string {
    return reservation.status === 'Confirmé' ? 'Confirmé' : 'Confirmer';
  }

  protected isConfirmed(reservation: CommercialReservation): boolean {
    return reservation.status === 'Confirmé';
  }

  protected rangeLabel(): string {
    const range = this.selectedRange();

    return range
      ? formatDateRange(range.start, range.end, ' - ')
      : 'Sélectionner une date';
  }
}
