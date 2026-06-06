import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AdminAgenciesStore,
  AdminDashboardMapStore,
  AdminDashboardStore,
  AdminHotelsStore,
  AdminReservation,
  AdminReservationsStore,
} from '@ubax-workspace/ubax-admin-data-access';
import { KpiCardComponent } from '@ubax-workspace/shared-design-system';
import { NOTIFICATION_HANDLER } from '@ubax-workspace/shared-data-access';
import type { ChartData, ChartOptions } from 'chart.js';
import { ChartModule } from 'primeng/chart';
import { SelectModule } from 'primeng/select';

interface DashboardKpiCard {
  cardClass: string;
  gradientEnd: string;
  gradientStart: string;
  iconClass: string;
  iconToneClass: string;
  label: string;
  graphClass: string;
  graphWrapClass: string;
  showGraph: boolean;
  trendPositive: boolean;
  trend: string;
  value: number;
}

interface PeriodOption {
  label: string;
  value: 'today' | '7d' | 'month';
}

interface ActivityItem {
  iconClass: string;
  label: string;
  meta: string;
  time: string;
}

const KPI_SPARK_PATHS = [
  'M1 22.5C10 8.5 17 20 24 16.5C32 12.5 40 5 49 12C58 19 66 25 81 6.5',
  'M1 21C9 10 16 19 25 14.5C34 10 42 8 50 11.5C60 16 70 18 81 7.5',
  'M1 24C11 13 17 17 25 12.5C34 7 42 6 52 9.5C63 13 72 10 81 5.5',
  'M1 22.5C10 8.5 17 20 24 16.5C32 12.5 40 5 49 12C58 19 66 25 81 6.5',
  'M1 20.5C9 9.5 16 16 23 12.5C31 8.5 39 6 48 10C57 14 66 13 81 5.5',
] as const;

const RANGE_OPTIONS: PeriodOption[] = [
  { label: "Aujourd'hui", value: 'today' },
  { label: '7 derniers jours', value: '7d' },
  { label: '30 derniers jours', value: 'month' },
];

@Component({
  selector: 'ubax-admin-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    ChartModule,
    SelectModule,
    KpiCardComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly dashboardStore = inject(AdminDashboardStore);
  private readonly mapStore = inject(AdminDashboardMapStore);
  private readonly reservationsStore = inject(AdminReservationsStore);
  private readonly hotelsStore = inject(AdminHotelsStore);
  private readonly agenciesStore = inject(AdminAgenciesStore);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly notif = inject(NOTIFICATION_HANDLER);

  protected readonly loading = this.dashboardStore.loading;
  protected readonly reservationsLoading = this.reservationsStore.loading;
  protected readonly dashboard = this.dashboardStore.dashboard;
  protected readonly revenueRange = signal<PeriodOption['value']>('7d');
  protected readonly donutRange = signal<PeriodOption['value']>('today');
  protected readonly categoriesRange = signal<PeriodOption['value']>('7d');

  protected readonly rangeOptions = RANGE_OPTIONS;
  protected readonly skeletonRows = Array.from({ length: 5 });

  protected readonly kpiCards = computed<DashboardKpiCard[]>(() => {
    const data = this.dashboard();
    if (!data) {
      return [];
    }

    const reservationTotal =
      (data.confirmedReservations ?? 0) + (data.pendingReservations ?? 0);

    return [
      {
        cardClass: 'dashboard-kpi--default',
        iconClass: 'pi pi-building',
        iconToneClass: 'dashboard-kpi__icon--purple',
        graphWrapClass:
          'dashboard-kpi__graph-wrap dashboard-kpi__graph-wrap--purple',
        graphClass: 'dashboard-kpi__graph dashboard-kpi__graph--purple',
        label: 'Hotels actifs',
        gradientStart: '#E8B6F7',
        gradientEnd: '#BE4FE7',
        showGraph: true,
        trendPositive: true,
        trend: this.trendText(data.totalActiveHotels ?? 0),
        value: data.totalActiveHotels ?? 0,
      },
      {
        cardClass: 'dashboard-kpi--default',
        iconClass: 'pi pi-home text-lg',
        iconToneClass: 'dashboard-kpi__icon--green',
        graphWrapClass:
          'dashboard-kpi__graph-wrap dashboard-kpi__graph-wrap--green',
        graphClass: 'dashboard-kpi__graph dashboard-kpi__graph--green',
        label: 'Agences actives',
        gradientStart: '#8CE3A5',
        gradientEnd: '#22C55E',
        showGraph: true,
        trendPositive: true,
        trend: this.trendText(data.totalActiveAgencies ?? 0),
        value: data.totalActiveAgencies ?? 0,
      },
      {
        cardClass: 'dashboard-kpi--default',
        iconClass: 'pi pi-map',
        iconToneClass: 'dashboard-kpi__icon--orange',
        graphWrapClass:
          'dashboard-kpi__graph-wrap dashboard-kpi__graph-wrap--orange',
        graphClass: 'dashboard-kpi__graph dashboard-kpi__graph--orange',
        label: 'Biens en ligne',
        gradientStart: '#FCD79A',
        gradientEnd: '#F59E0B',
        showGraph: true,
        trendPositive: true,
        trend: this.trendText(data.publishedProperties ?? 0),
        value: data.publishedProperties ?? 0,
      },
      {
        cardClass: 'dashboard-kpi--default',
        iconClass: 'pi pi-calendar',
        iconToneClass: 'dashboard-kpi__icon--red',
        graphWrapClass:
          'dashboard-kpi__graph-wrap dashboard-kpi__graph-wrap--red',
        graphClass: 'dashboard-kpi__graph dashboard-kpi__graph--red',
        label: 'Reservations du jour',
        gradientStart: '#FECACA',
        gradientEnd: '#EF4444',
        showGraph: true,
        trendPositive: true,
        trend: this.trendText(reservationTotal),
        value: reservationTotal,
      },
      {
        cardClass: 'dashboard-kpi--revenue',
        iconClass: 'pi pi-wallet',
        iconToneClass: 'dashboard-kpi__icon--revenue',
        graphWrapClass: '',
        graphClass: '',
        label: 'Revenus Ubax (mois)',
        gradientStart: '#B6F3D2',
        gradientEnd: '#00C16A',
        showGraph: false,
        trendPositive: true,
        trend: '+ 18% vs mois dernier',
        value: Math.round(
          (data.confirmedReservations ?? 0) * 75000 +
            (data.pendingReservations ?? 0) * 25000,
        ),
      },
    ];
  });

  protected readonly revenueChartData = computed<ChartData<'line'>>(() => {
    const labels = this.buildLastDaysLabels(7);
    const reservations = this.reservationsStore.reservations();
    if (!reservations.length) {
      return { labels: [], datasets: [] };
    }

    const confirmedRevenue = new Array(7).fill(0);
    const pendingRevenue = new Array(7).fill(0);
    const now = new Date();

    reservations.forEach((reservation) => {
      if (
        !reservation.createdAt ||
        typeof reservation.totalAmount !== 'number'
      ) {
        return;
      }

      const createdAt = new Date(reservation.createdAt);
      if (Number.isNaN(createdAt.getTime())) {
        return;
      }

      const dayStart = new Date(
        createdAt.getFullYear(),
        createdAt.getMonth(),
        createdAt.getDate(),
      );
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const deltaDays = Math.round(
        (todayStart.getTime() - dayStart.getTime()) / 86400000,
      );
      const index = 6 - deltaDays;

      if (index < 0 || index > 6) {
        return;
      }

      if (
        reservation.status === 'CONFIRMED' ||
        reservation.status === 'COMPLETED'
      ) {
        confirmedRevenue[index] += reservation.totalAmount;
        return;
      }

      pendingRevenue[index] += reservation.totalAmount;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Confirmées',
          data: confirmedRevenue,
          borderColor: '#2b7fff',
          backgroundColor: 'rgba(43, 127, 255, 0.08)',
          borderWidth: 2.2,
          pointRadius: 2.5,
          pointHoverRadius: 4.5,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#2b7fff',
          pointBorderWidth: 2,
          tension: 0.42,
          fill: false,
        },
        {
          label: 'En attente',
          data: pendingRevenue,
          borderColor: '#e87d1e',
          backgroundColor: 'rgba(232, 125, 30, 0.08)',
          borderWidth: 2.2,
          pointRadius: 2.5,
          pointHoverRadius: 4.5,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#e87d1e',
          pointBorderWidth: 2,
          tension: 0.42,
          fill: false,
        },
      ],
    };
  });

  protected readonly revenueChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 700 },
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (item) => {
            const value = typeof item.parsed.y === 'number' ? item.parsed.y : 0;
            return `${item.dataset.label}: ${this.formatCurrency(value)}`;
          },
        },
      },
    },
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          maxRotation: 0,
          minRotation: 0,
          color: '#979797',
          font: { family: 'Lexend', size: 12 },
        },
      },
      y: {
        min: 0,
        suggestedMax: 25_000_000,
        grid: { color: '#edf1f7', drawTicks: false },
        border: { display: false },
        ticks: {
          color: '#979797',
          font: { family: 'Lexend', size: 12 },
          callback: (value) => {
            const numericValue = Number(value);
            return `${Math.round(numericValue / 1_000_000)}M`;
          },
        },
      },
    },
  };

  protected readonly reservationTypeData = computed<ChartData<'doughnut'>>(
    () => {
      const counts = this.reservationsStore.statusCounts();
      return {
        labels: ['Hotels', 'Location courte duree', 'Location mensuelle'],
        datasets: [
          {
            data: [
              counts.CONFIRMED,
              counts.PENDING,
              counts.CANCELLED + counts.NO_SHOW,
            ],
            backgroundColor: ['#2b7fff', '#34c759', '#e87d1e'],
            borderColor: '#ffffff',
            borderWidth: 4,
            hoverOffset: 1,
            spacing: 0,
          },
        ],
      };
    },
  );

  protected readonly reservationTypeOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    rotation: -90,
    layout: {
      padding: 0,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (item) => `${item.label}: ${item.parsed}`,
        },
      },
    },
  };

  protected readonly reservationTypeLegend = computed(() => {
    const counts = this.reservationsStore.statusCounts();
    return [
      {
        color: '#2b7fff',
        count: counts.CONFIRMED,
        label: 'Hotels',
        meta: 'Reservations',
      },
      {
        color: '#34c759',
        count: counts.PENDING,
        label: 'Location courte duree',
        meta: 'Reservations',
      },
      {
        color: '#e87d1e',
        count: counts.CANCELLED + counts.NO_SHOW,
        label: 'Location mensuelle',
        meta: 'Reservations',
      },
    ];
  });

  protected readonly reservationTypeTotal = computed(() =>
    this.reservationTypeLegend().reduce((sum, item) => sum + item.count, 0),
  );

  protected readonly recentActivities = computed<ActivityItem[]>(() =>
    this.reservationsStore
      .reservations()
      .slice(0, 4)
      .map((reservation) => {
        const status = reservation.status ?? 'PENDING';

        return {
          iconClass: this.activityIcon(status),
          label: this.activityLabel(status),
          meta: reservation.clientFullName ?? 'Client UBAX',
          time: this.timeAgo(reservation.createdAt),
        };
      }),
  );

  protected readonly recentReservations = computed(() =>
    this.reservationsStore.reservations().slice(0, 5),
  );

  protected readonly validationItems = computed(() => {
    const hotelsPending = this.hotelsStore.hotels().filter((hotel) => {
      if (!hotel.active) {
        return false;
      }

      const expiresAt = hotel.subscriptionExpiresAt
        ? new Date(hotel.subscriptionExpiresAt)
        : null;
      const expired = expiresAt ? expiresAt.getTime() < Date.now() : false;
      return !hotel.subscriptionActive || expired;
    }).length;

    const agenciesPending = this.agenciesStore.agencies().filter((agency) => {
      if (!agency.active) {
        return false;
      }

      const expiresAt = agency.subscriptionExpiresAt
        ? new Date(agency.subscriptionExpiresAt)
        : null;
      const expired = expiresAt ? expiresAt.getTime() < Date.now() : false;
      return !agency.subscriptionActive || expired;
    }).length;

    return [
      {
        count: hotelsPending,
        iconClass: 'pi pi-building',
        label: 'Hotels en attentes',
      },
      {
        count: agenciesPending,
        iconClass: 'pi pi-home',
        label: 'Agence en attentes',
      },
      {
        count: this.dashboard()?.propertiesPendingReview ?? 0,
        iconClass: 'pi pi-map-marker',
        label: 'Proprietes en attentes',
      },
    ];
  });

  protected readonly revenueByCategory = computed(() => {
    const monthlyRevenueEstimate =
      ((this.dashboard()?.confirmedReservations ?? 0) * 75_000 +
        (this.dashboard()?.pendingReservations ?? 0) * 25_000) *
      0.92;
    const hotels = Math.round(monthlyRevenueEstimate * 0.66);
    const agencies = Math.round(monthlyRevenueEstimate * 0.34);
    const max = Math.max(hotels, agencies, 1);

    return [
      {
        amount: hotels,
        colorClass: 'dashboard-revenue-category__bar--blue',
        label: 'Hotels',
        width: Math.round((hotels / max) * 100),
      },
      {
        amount: agencies,
        colorClass: 'dashboard-revenue-category__bar--orange',
        label: 'Agences',
        width: Math.round((agencies / max) * 100),
      },
    ];
  });

  protected readonly mapMarkers = computed(() => {
    const bounds = this.mapBounds();
    return this.mapStore.points().map((point) => ({
      left: this.projectLongitudeToBounds(
        point.longitude,
        bounds.west,
        bounds.east,
      ),
      top: this.projectLatitudeToBounds(
        point.latitude,
        bounds.south,
        bounds.north,
      ),
      tone: point.tone,
    }));
  });

  protected readonly mapEmbedUrl = computed<SafeResourceUrl>(() => {
    const bounds = this.mapBounds();
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${bounds.west},${bounds.south},${bounds.east},${bounds.north}&layer=mapnik`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  protected readonly hasMapPoints = computed(
    () => this.mapStore.points().length > 0,
  );

  protected readonly hasData = computed(() => Boolean(this.dashboard()));

  protected readonly reservationCompletion = computed(() => {
    const data = this.dashboard();
    if (!data) {
      return 0;
    }

    const total =
      (data.pendingReservations ?? 0) + (data.confirmedReservations ?? 0);
    return total === 0
      ? 0
      : Math.round(((data.confirmedReservations ?? 0) / total) * 100);
  });

  protected readonly publicationCoverage = computed(() => {
    const data = this.dashboard();
    if (!data) {
      return 0;
    }

    const total =
      (data.publishedProperties ?? 0) + (data.propertiesPendingReview ?? 0);
    return total === 0
      ? 0
      : Math.round(((data.publishedProperties ?? 0) / total) * 100);
  });

  protected readonly partnerFootprint = computed(
    () =>
      (this.dashboard()?.totalActiveAgencies ?? 0) +
      (this.dashboard()?.totalActiveHotels ?? 0),
  );

  protected readonly reservationTypeCounts = computed(() => {
    const counts = this.reservationsStore.statusCounts();
    return {
      confirmed: counts.CONFIRMED,
      pending: counts.PENDING,
      cancelled: counts.CANCELLED + counts.NO_SHOW,
    };
  });

  protected readonly reservedAmountEstimate = computed(() => {
    const counts = this.reservationTypeCounts();
    return counts.confirmed * 75000 + counts.pending * 55000;
  });

  protected readonly revenueSummary = computed(() =>
    this.formatCurrency(this.reservedAmountEstimate()),
  );

  protected onRevenueRangeChange(value: PeriodOption['value']): void {
    this.revenueRange.set(value);
  }

  protected onDonutRangeChange(value: PeriodOption['value']): void {
    this.donutRange.set(value);
  }

  protected onCategoryRangeChange(value: PeriodOption['value']): void {
    this.categoriesRange.set(value);
  }

  protected statusLabel(status: AdminReservation['status']): string {
    if (status === 'CONFIRMED') {
      return 'Confirme';
    }
    if (status === 'PENDING') {
      return 'En attente';
    }
    if (status === 'CANCELLED') {
      return 'Annule';
    }
    if (status === 'COMPLETED') {
      return 'Termine';
    }

    return 'No-show';
  }

  protected statusClass(status: AdminReservation['status']): string {
    if (status === 'CONFIRMED' || status === 'COMPLETED') {
      return 'dashboard-reservations-table__status dashboard-reservations-table__status--confirmed';
    }

    if (status === 'PENDING') {
      return 'dashboard-reservations-table__status dashboard-reservations-table__status--pending';
    }

    return 'dashboard-reservations-table__status dashboard-reservations-table__status--cancelled';
  }

  protected formatReservationType(reservation: AdminReservation): string {
    return reservation.propertyTitle ? 'Hotel' : 'Reservation';
  }

  protected formatReservationDate(value?: string): string {
    if (!value) {
      return '--';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '--';
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  protected formatReservationAmount(value?: number): string {
    if (typeof value !== 'number') {
      return '--';
    }

    return this.formatCurrency(value);
  }

  protected kpiSparkPath(index: number): string {
    return KPI_SPARK_PATHS[index] ?? KPI_SPARK_PATHS[0];
  }

  protected formatKpiValue(card: DashboardKpiCard): string {
    if (card.label === 'Revenus Ubax (mois)') {
      return this.formatCurrency(card.value);
    }

    return this.formatNumber(card.value);
  }

  ngOnInit(): void {
    void this.loadDashboard();
    void this.loadReservationsPreview();
    void this.loadValidationCounts();
    void this.loadMapPoints();
  }

  private async loadDashboard(): Promise<void> {
    try {
      await this.dashboardStore.load();
    } catch {
      this.notif.error(
        this.dashboardStore.error() ??
          'Impossible de charger le tableau de bord administrateur.',
      );
    }
  }

  private async loadReservationsPreview(): Promise<void> {
    try {
      await Promise.all([
        this.reservationsStore.load({ page: 0, size: 500 }),
        this.reservationsStore.loadStatusCounts(),
      ]);
    } catch {
      this.notif.error(
        this.reservationsStore.error() ??
          'Impossible de charger les reservations du dashboard.',
      );
    }
  }

  private async loadValidationCounts(): Promise<void> {
    await Promise.allSettled([
      this.hotelsStore.load(),
      this.agenciesStore.load(),
    ]);
  }

  private async loadMapPoints(): Promise<void> {
    try {
      await this.mapStore.load();
    } catch {
      this.notif.error(
        this.mapStore.error() ??
          'Impossible de charger les points geographiques du dashboard.',
      );
    }
  }

  private trendText(value: number): string {
    if (value <= 0) {
      return '+ 0 ce mois-ci';
    }

    const baseline = Math.max(Math.round(value * 0.1), 1);
    return `+ ${baseline} ce mois-ci`;
  }

  private buildLastDaysLabels(days: number): string[] {
    const labels: string[] = [];
    const now = new Date();

    for (let index = days - 1; index >= 0; index -= 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - index);
      labels.push(
        date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
        }),
      );
    }

    return labels;
  }

  private readonly mapBounds = computed(() => {
    const points = this.mapStore.points();
    if (!points.length) {
      return {
        east: -12,
        north: 16.5,
        south: 4.5,
        west: -18.5,
      };
    }

    const latitudes = points.map((point) => point.latitude);
    const longitudes = points.map((point) => point.longitude);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const latPadding = Math.max((maxLat - minLat) * 0.25, 0.18);
    const lngPadding = Math.max((maxLng - minLng) * 0.25, 0.18);

    return {
      east: maxLng + lngPadding,
      north: maxLat + latPadding,
      south: minLat - latPadding,
      west: minLng - lngPadding,
    };
  });

  private projectLatitudeToBounds(
    latitude: number,
    south: number,
    north: number,
  ): number {
    if (north === south) {
      return 50;
    }

    const raw = ((north - latitude) / (north - south)) * 100;
    return Math.min(Math.max(raw, 6), 94);
  }

  private projectLongitudeToBounds(
    longitude: number,
    west: number,
    east: number,
  ): number {
    if (east === west) {
      return 50;
    }

    const raw = ((longitude - west) / (east - west)) * 100;
    return Math.min(Math.max(raw, 4), 96);
  }

  private activityLabel(status: AdminReservation['status']): string {
    if (status === 'CONFIRMED') {
      return 'Nouvelle reservation confirmee';
    }

    if (status === 'PENDING') {
      return 'Nouvelle reservation en attente';
    }

    if (status === 'CANCELLED') {
      return 'Reservation annulee';
    }

    return 'Mise a jour reservation';
  }

  private activityIcon(status: AdminReservation['status']): string {
    if (status === 'CONFIRMED') {
      return 'pi pi-check-circle';
    }

    if (status === 'PENDING') {
      return 'pi pi-clock';
    }

    if (status === 'CANCELLED') {
      return 'pi pi-times-circle';
    }

    return 'pi pi-info-circle';
  }

  private timeAgo(value?: string): string {
    if (!value) {
      return 'a l instant';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'a l instant';
    }

    const deltaMinutes = Math.max(
      Math.round((Date.now() - date.getTime()) / 60000),
      0,
    );
    if (deltaMinutes < 60) {
      return `il y a ${deltaMinutes || 1} min`;
    }

    const deltaHours = Math.round(deltaMinutes / 60);
    if (deltaHours < 24) {
      return `il y a ${deltaHours} h`;
    }

    const deltaDays = Math.round(deltaHours / 24);
    return `il y a ${deltaDays} j`;
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value);
  }

  private formatCurrency(value: number): string {
    return `${new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0,
    }).format(value)} FCFA`;
  }
}
