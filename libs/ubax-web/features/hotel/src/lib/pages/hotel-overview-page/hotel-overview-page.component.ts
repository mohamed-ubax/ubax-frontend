import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ChartData, ChartOptions, Plugin, ScriptableContext } from 'chart.js';
import { LazyChartComponent } from '@ubax-workspace/shared-ui';

type TrendRangeKey = 'jan-jun' | 'apr-sep' | 'jul-dec';

interface ReservationMonth {
  label: string;
  active?: boolean;
}

interface TrendRangeOption {
  label: string;
  value: TrendRangeKey;
}

interface TrendRangeConfig {
  months: string[];
  values: number[];
  activeIndex: number;
  count: number;
  growth: string;
}

interface NotificationItem {
  id: number;
  type: 'new' | 'cancel' | 'confirm';
  title: string;
  subtitle: string;
  time: string;
}

interface ReservationRow {
  id: number;
  image: string;
  guest: string;
  room: string;
  duration: string;
  dates: string;
  status: string;
}

interface PropertyCard {
  id: number;
  image: string;
  tenantAvatar: string;
  tenantName: string;
  price: string;
}

@Component({
  selector: 'ubax-hotel-overview-page',
  standalone: true,
  imports: [FormsModule, LazyChartComponent, DatePickerModule, SelectModule],
  templateUrl: './hotel-overview-page.component.html',
  styleUrl: './hotel-overview-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotelOverviewPageComponent {
  readonly occupancyRate = 82;
  readonly arrivalsToday = 8;
  readonly departuresToday = 3;
  readonly dailyRevenue = '750 000 FCFA';
  selectedDate = new Date(2026, 3, 18);

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

  constructor() {
    this.applyTrendRange(this.selectedTrendRange);
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
      time: 'Il y’a 5 minutes',
    },
    {
      id: 2,
      type: 'cancel',
      title: 'Réservation Annulée',
      subtitle: 'Résidence Plateau - App 12',
      time: 'Il y’a 15 minutes',
    },
    {
      id: 3,
      type: 'confirm',
      title: 'Paiement confirmé',
      subtitle: 'Résidence Plateau - App 12',
      time: 'Il y’a 35 minutes',
    },
    {
      id: 4,
      type: 'new',
      title: 'Nouvelle réservation',
      subtitle: 'Résidence Plateau - App 12',
      time: 'Il y’a 5 minutes',
    },
    {
      id: 5,
      type: 'confirm',
      title: 'Paiement confirmé',
      subtitle: 'Résidence Plateau - App 12',
      time: 'Il y’a 35 minutes',
    },
  ];

  readonly reservations: ReservationRow[] = [
    {
      id: 1,
      image: 'hotel-dashboard/reservations/guest-01.webp',
      guest: 'Koné Ibrahim',
      room: 'Résidence Plateau',
      duration: '2 jours',
      dates: '14 Avril 2026 - 18 Avril 2026',
      status: 'Confirmé',
    },
    {
      id: 2,
      image: 'hotel-dashboard/reservations/guest-02.webp',
      guest: 'Koné Ibrahim',
      room: 'Résidence Plateau',
      duration: '2 jours',
      dates: '14 Avril 2026 - 18 Avril 2026',
      status: 'Confirmé',
    },
    {
      id: 3,
      image: 'hotel-dashboard/reservations/guest-03.webp',
      guest: 'Koné Ibrahim',
      room: 'Résidence Plateau',
      duration: '2 jours',
      dates: '14 Avril 2026 - 18 Avril 2026',
      status: 'Confirmé',
    },
    {
      id: 4,
      image: 'hotel-dashboard/reservations/guest-04.webp',
      guest: 'Koné Ibrahim',
      room: 'Résidence Plateau',
      duration: '2 jours',
      dates: '14 Avril 2026 - 18 Avril 2026',
      status: 'Confirmé',
    },
    {
      id: 5,
      image: 'hotel-dashboard/reservations/guest-05.webp',
      guest: 'Koné Ibrahim',
      room: 'Résidence Plateau',
      duration: '2 jours',
      dates: '14 Avril 2026 - 18 Avril 2026',
      status: 'Confirmé',
    },
  ];

  readonly availableProperties: PropertyCard[] = [
    {
      id: 1,
      image: 'shared/rooms/room-photo-01.webp',
      tenantAvatar: 'hotel-dashboard/properties/tenant-aicha.webp',
      tenantName: 'Aïcha Kouadio',
      price: '400 000 FCFA',
    },
    {
      id: 2,
      image: 'hotel-dashboard/properties/property-patrick.webp',
      tenantAvatar: 'hotel-dashboard/properties/tenant-patrick.webp',
      tenantName: 'Patrick Koffi',
      price: '350 000 FCFA',
    },
    {
      id: 3,
      image: 'hotel-dashboard/properties/property-kevin.webp',
      tenantAvatar: 'hotel-dashboard/properties/tenant-kevin.webp',
      tenantName: 'Kevin Kouassi',
      price: '550 000 FCFA',
    },
    {
      id: 4,
      image: 'hotel-dashboard/properties/property-armand.webp',
      tenantAvatar: 'hotel-dashboard/properties/tenant-armand.webp',
      tenantName: 'Armand Tano',
      price: '765 000 FCFA',
    },
  ];
}
