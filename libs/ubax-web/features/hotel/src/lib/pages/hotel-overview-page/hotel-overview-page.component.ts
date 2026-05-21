import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ChartData, ChartOptions, Plugin, ScriptableContext } from 'chart.js';
import { LazyChartComponent } from '@ubax-workspace/shared-ui';
import {
  ESPACE_STATUS_LABELS,
  HotelReservation,
  HotelReservationsStore,
  MesEspacesStore,
  resolvePropertyCardImage,
} from '@ubax-workspace/ubax-web-data-access';
import { PropertyResponse } from '@ubax-workspace/shared-api-types';
import type {
  TrendRangeKey,
  ReservationMonth,
  TrendRangeOption,
  TrendRangeConfig,
  NotificationItem,
  ReservationRow,
  PropertyCard,
} from '../../types/hotel-overview.types';

@Component({
  selector: 'ubax-hotel-overview-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    LazyChartComponent,
    DatePickerModule,
    SelectModule,
  ],
  templateUrl: './hotel-overview-page.component.html',
  styleUrl: './hotel-overview-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotelOverviewPageComponent {
  private readonly reservationsStore = inject(HotelReservationsStore);
  private readonly espacesStore = inject(MesEspacesStore);

  readonly occupancyRate = 82;
  readonly arrivalsToday = 8;
  readonly departuresToday = 3;
  readonly dailyRevenue = '750 000 FCFA';
  selectedDate = new Date(2026, 3, 18);
  readonly reservationSearch = signal('');

  readonly revenueChartData: ChartData<'bar'> = {
    labels: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    datasets: [
      {
        data: [1800, 2200, 1000, 2450, 2780, 1400, 1300],
        backgroundColor: '#1a3047',
        borderRadius: 18,
        borderSkipped: false,
        barPercentage: 0.52,
        categoryPercentage: 0.78,
        maxBarThickness: 28,
      },
    ],
  };

  readonly revenueChartOptions: ChartOptions<'bar'> = {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a3047',
        displayColors: false,
        padding: 10,
      },
    },
    layout: {
      padding: { top: 4, right: 8, bottom: 0, left: 0 },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: '#615e83',
          font: { family: 'Lexend', size: 12, weight: 400 },
          maxRotation: 0,
        },
      },
      y: {
        min: 0,
        max: 3000,
        ticks: {
          stepSize: 1000,
          color: '#615e83',
          font: { family: 'Lexend', size: 14, weight: 400 },
          padding: 14,
          callback: (value) => {
            if (value === 0) return '0';
            return `${Number(value) / 1000}k`;
          },
        },
        grid: {
          color: '#edf2f7',
        },
        border: { display: false },
      },
    },
  };

  readonly trendRangeOptions: TrendRangeOption[] = [
    { label: 'Janvier - Juin', value: 'jan-jun' },
    { label: 'Avril - Septembre', value: 'apr-sep' },
    { label: 'Juillet - Décembre', value: 'jul-dec' },
  ];

  private readonly trendRangeConfigs: Record<TrendRangeKey, TrendRangeConfig> =
    {
      'jan-jun': {
        months: ['Jan', 'Fev', 'Mars', 'Avr', 'Mai', 'Juin'],
        values: [32, 48, 58, 36, 61, 41],
        activeIndex: 2,
        count: 58,
        growth: '23%',
      },
      'apr-sep': {
        months: ['Avr', 'Mai', 'Juin', 'Juil', 'Aout', 'Sept'],
        values: [27, 39, 44, 51, 63, 56],
        activeIndex: 4,
        count: 63,
        growth: '18%',
      },
      'jul-dec': {
        months: ['Juil', 'Aout', 'Sept', 'Oct', 'Nov', 'Dec'],
        values: [42, 54, 47, 66, 59, 71],
        activeIndex: 5,
        count: 71,
        growth: '27%',
      },
    };

  selectedTrendRange: TrendRangeKey = 'jan-jun';
  reservationMonths: ReservationMonth[] = [];
  trendCount = 0;
  trendGrowth = '0%';
  private activeTrendPointIndex = 0;
  reservationTrendData: ChartData<'line'> = this.createReservationTrendData(
    this.trendRangeConfigs['jan-jun'],
  );

  readonly reservationTrendOptions: ChartOptions<'line'> = {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        displayColors: false,
        backgroundColor: '#1a3047',
        padding: 10,
      },
    },
    elements: {
      line: { capBezierPoints: true },
    },
    layout: {
      padding: { top: 10, right: 10, bottom: 0, left: 6 },
    },
    scales: {
      x: {
        display: false,
        border: { display: false },
        grid: { display: false },
      },
      y: {
        display: false,
        border: { display: false },
        grid: { display: false },
      },
    },
  };

  readonly reservationTrendPlugins: Plugin<'line'>[] = [
    {
      id: 'hotelTrendActiveGuide',
      afterDatasetsDraw: (chart) => {
        const datasetMeta = chart.getDatasetMeta(0);
        const activePoint = datasetMeta.data[this.activeTrendPointIndex];

        if (!activePoint) {
          return;
        }

        const { ctx, chartArea } = chart;
        const pointProps = activePoint.getProps(['x', 'y'], true);

        ctx.save();
        ctx.strokeStyle = '#e87d1e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pointProps['x'], pointProps['y'] + 8);
        ctx.lineTo(pointProps['x'], chartArea.bottom - 4);
        ctx.stroke();
        ctx.restore();
      },
    },
  ];

  readonly reservations = computed<ReservationRow[]>(() => {
    const query = this.normalizeText(this.reservationSearch());

    return this.reservationsStore
      .entities()
      .map((reservation) => this.mapReservationRow(reservation))
      .filter((reservation) => {
        if (!query) {
          return true;
        }

        return this.normalizeText(
          [
            reservation.guest,
            reservation.room,
            reservation.status,
            reservation.dates,
          ].join(' '),
        ).includes(query);
      })
      .slice(0, 5);
  });

  readonly availableProperties = computed<PropertyCard[]>(() => {
    const propertyTypeLabels = new Map(
      this.espacesStore
        .codeListPropertyTypes()
        .map((item) => [
          item.value ?? '',
          item.description ?? item.value ?? 'Espace',
        ]),
    );

    return this.espacesStore
      .entities()
      .filter((property) => property.status === 'PUBLISHED')
      .slice(0, 4)
      .map((property, index) =>
        this.mapPropertyCard(property, index, propertyTypeLabels),
      );
  });

  constructor() {
    this.applyTrendRange(this.selectedTrendRange);
    this.reservationsStore.load?.({
      pageable: {
        page: 0,
        size: 5,
        sort: ['createdAt,desc'],
      },
    });
    this.espacesStore.chargerEspaces({
      page: 0,
      size: 8,
      status: 'PUBLISHED',
    });
  }

  onTrendRangeChange(range: TrendRangeKey): void {
    if (!range) {
      return;
    }

    this.applyTrendRange(range);
  }

  private applyTrendRange(range: TrendRangeKey): void {
    const config = this.trendRangeConfigs[range];

    this.selectedTrendRange = range;
    this.activeTrendPointIndex = config.activeIndex;
    this.trendCount = config.count;
    this.trendGrowth = config.growth;
    this.reservationMonths = config.months.map((label, index) => ({
      label,
      active: index === config.activeIndex,
    }));
    this.reservationTrendData = this.createReservationTrendData(config);
  }

  private createReservationTrendData(
    config: TrendRangeConfig,
  ): ChartData<'line'> {
    return {
      labels: config.months,
      datasets: [
        {
          data: config.values,
          borderColor: '#e87d1e',
          backgroundColor: (context: ScriptableContext<'line'>) => {
            const { chart } = context;
            const { chartArea, ctx } = chart;

            if (!chartArea) {
              return 'rgba(232, 125, 30, 0.16)';
            }

            const gradient = ctx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom,
            );
            gradient.addColorStop(0, 'rgba(232, 125, 30, 0.26)');
            gradient.addColorStop(1, 'rgba(232, 125, 30, 0)');

            return gradient;
          },
          fill: true,
          tension: 0.44,
          borderWidth: 2,
          pointRadius: (context) =>
            context.dataIndex === config.activeIndex ? 4 : 0,
          pointHoverRadius: 4,
          pointBackgroundColor: '#e87d1e',
          pointBorderWidth: 0,
        },
      ],
    };
  }

  readonly notifications: NotificationItem[] = [
    {
      id: 1,
      type: 'new',
      title: 'Nouvelle réservation',
      subtitle: 'Résidence Plateau - App 12',
      time: "Il y'a 5 minutes",
    },
    {
      id: 2,
      type: 'cancel',
      title: 'Réservation Annulée',
      subtitle: 'Résidence Plateau - App 12',
      time: "Il y'a 15 minutes",
    },
    {
      id: 3,
      type: 'confirm',
      title: 'Paiement confirmé',
      subtitle: 'Résidence Plateau - App 12',
      time: "Il y'a 35 minutes",
    },
    {
      id: 4,
      type: 'new',
      title: 'Nouvelle réservation',
      subtitle: 'Résidence Plateau - App 12',
      time: "Il y'a 5 minutes",
    },
    {
      id: 5,
      type: 'confirm',
      title: 'Paiement confirmé',
      subtitle: 'Résidence Plateau - App 12',
      time: "Il y'a 35 minutes",
    },
  ];

  private mapReservationRow(reservation: HotelReservation): ReservationRow {
    return {
      id: reservation.id,
      image: this.resolveGuestImage(reservation.id),
      guest: reservation.clientFullName ?? 'Client non renseigné',
      room: reservation.propertyTitle ?? 'Bien non renseigné',
      duration: this.formatDuration(reservation.numberOfNights),
      dates: this.formatDateRange(
        reservation.checkInDate,
        reservation.checkOutDate,
      ),
      status: this.statusLabel(reservation.status),
    };
  }

  private formatDuration(numberOfNights?: number): string {
    if (!numberOfNights || numberOfNights <= 0) {
      return '—';
    }

    return `${numberOfNights} jour${numberOfNights > 1 ? 's' : ''}`;
  }

  private formatDateRange(checkInDate?: string, checkOutDate?: string): string {
    return `${this.formatDate(checkInDate)} - ${this.formatDate(checkOutDate)}`;
  }

  private formatDate(value?: string): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  private mapPropertyCard(
    property: PropertyResponse,
    index: number,
    propertyTypeLabels: ReadonlyMap<string, string>,
  ): PropertyCard {
    const propertyType = property.propertyType ?? '';
    const status = property.status ?? 'PUBLISHED';

    return {
      id: property.id ?? `espace-${index + 1}`,
      image: resolvePropertyCardImage(
        property,
        'shared/rooms/room-photo-01.webp',
      ),
      title: property.title?.trim() || 'Espace sans titre',
      city: property.city?.trim() || 'Ville non renseignée',
      typeLabel:
        (propertyTypeLabels.get(propertyType) ?? propertyType) || 'Espace',
      statusLabel: ESPACE_STATUS_LABELS[status] ?? status,
      price: this.formatPrice(property.price),
    };
  }

  private formatPrice(value?: number | null): string {
    if (value == null) {
      return '—';
    }

    return `${new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0,
    }).format(value)} FCFA`;
  }

  private statusLabel(status?: HotelReservation['status']): string {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmé';
      case 'CANCELLED':
        return 'Annulé';
      case 'COMPLETED':
        return 'Terminé';
      case 'NO_SHOW':
        return 'No-show';
      case 'PENDING':
      default:
        return 'En attente';
    }
  }

  private resolveGuestImage(id: string): string {
    const images = [
      'hotel-dashboard/reservations/guest-01.webp',
      'hotel-dashboard/reservations/guest-02.webp',
      'hotel-dashboard/reservations/guest-03.webp',
      'hotel-dashboard/reservations/guest-04.webp',
      'hotel-dashboard/reservations/guest-05.webp',
    ];
    const hash = Array.from(id).reduce(
      (sum, char) => sum + (char.codePointAt(0) ?? 0),
      0,
    );

    return images[hash % images.length];
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
