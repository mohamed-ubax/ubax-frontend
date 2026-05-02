import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { UIChart } from 'primeng/chart';
import { ChartData, ChartOptions } from 'chart.js';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access';
import {
  DateRange,
  DateRangePickerComponent,
  UbaxPaginatorComponent,
} from '@ubax-workspace/shared-ui';

type DashboardKpiCard = {
  readonly label: string;
  readonly value: string;
  readonly trend?: string;
  readonly tone: 'all' | 'active' | 'rented' | 'sold';
  readonly iconSrc: string;};

type DashboardPropertyRow = {
  readonly uid: string;
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly location: string;
  readonly price: string;
  readonly tenant: string;
  readonly status: string;
  readonly avatar: string;};

type DashboardDonutLegendItem = {
  readonly count: number;
  readonly label: string;
  readonly tone: 'occupied' | 'available' | 'reserved' | 'maintenance';};

type DashboardRevenueBar = {
  readonly label: string;
  readonly slug:
    | 'jan'
    | 'fev'
    | 'mar'
    | 'avr'
    | 'mai'
    | 'jui-1'
    | 'jui-2'
    | 'aou'
    | 'sep'
    | 'oct'
    | 'nov'
    | 'dec';
  readonly value: number;
  readonly highlighted?: boolean;};

type DashboardTransaction = {
  readonly uid: string;
  readonly title: string;
  readonly date: string;
  readonly customer: string;
  readonly amount: string;
  readonly month: string;
  readonly logo: string;};

const PAGE_SIZE = 8;
const REVENUE_MAX = 10_000_000;

const DASHBOARD_ICONS = {
  search: 'archivages/commercial/icons/search.webp',
  calendar: 'archivages/commercial/icons/calendar-toolbar.webp',
  export: 'archivages/commercial/icons/export.webp',
  chevronDown: 'archivages/commercial/icons/chevron-down.webp',
  eye: 'client-detail/icons/eye.svg',
  paginatorPrevious: 'archivages/commercial/icons/paginator-previous.webp',
  paginatorNext: 'archivages/commercial/icons/paginator-next.webp',
} as const;

const KPI_CARDS: readonly DashboardKpiCard[] = [
  {
    label: 'Tous les biens',
    value: '45',
    trend: '+2%',
    tone: 'all',
    iconSrc: 'rooms/icons/stat-all.svg',
  },
  {
    label: 'Annonces actives',
    value: '10',
    tone: 'active',
    iconSrc: 'rooms/icons/stat-online.svg',
  },
  {
    label: 'Biens Loués',
    value: '33',
    tone: 'rented',
    iconSrc: 'rooms/icons/stat-occupied.svg',
  },
  {
    label: 'Biens Vendus',
    value: '2',
    tone: 'sold',
    iconSrc: 'rooms/icons/stat-reserved.svg',
  },
];

const DONUT_LEGEND: readonly DashboardDonutLegendItem[] = [
  { count: 9, label: 'Occupés', tone: 'occupied' },
  { count: 6, label: 'Disponibles', tone: 'available' },
  { count: 12, label: 'Réservés', tone: 'reserved' },
  { count: 2, label: 'En maintenance', tone: 'maintenance' },
];

const REVENUE_BARS: readonly DashboardRevenueBar[] = [
  { label: 'JAN', slug: 'jan', value: 1_000_000 },
  { label: 'FEV', slug: 'fev', value: 3_150_000 },
  { label: 'MAR', slug: 'mar', value: 4_450_000 },
  { label: 'AVR', slug: 'avr', value: 1_000_000 },
  { label: 'MAI', slug: 'mai', value: 2_950_000 },
  { label: 'JUI', slug: 'jui-1', value: 6_730_000, highlighted: true },
  { label: 'JUI', slug: 'jui-2', value: 2_250_000 },
  { label: 'AOU', slug: 'aou', value: 1_280_000 },
  { label: 'SEP', slug: 'sep', value: 3_150_000 },
  { label: 'OCT', slug: 'oct', value: 1_000_000 },
  { label: 'NOV', slug: 'nov', value: 3_150_000 },
  { label: 'DEC', slug: 'dec', value: 4_450_000 },
];

const OVERVIEW_PROPERTIES: readonly DashboardPropertyRow[] = [
  {
    uid: 'overview-1',
    id: 'UBX-001',
    name: 'Immeuble kalia',
    type: 'Appartement',
    location: 'Abidjan, Cocody',
    price: '450 000 FCFA/mois',
    tenant: 'Koné Ibrahim',
    status: 'Actif',
    avatar: 'biens/list/list-tenant-01.webp',
  },
  {
    uid: 'overview-2',
    id: 'UBX-002',
    name: 'Villa Riviera',
    type: 'Villa',
    location: 'Abidjan, Riviera',
    price: '600 000 FCFA/mois',
    tenant: 'Koffi Didier',
    status: 'Actif',
    avatar: 'shared/people/profile-01.webp',
  },
  {
    uid: 'overview-3',
    id: 'UBX-003',
    name: 'Villa Riviera',
    type: 'Villa',
    location: 'Abidjan, Riviera',
    price: '600 000 FCFA/mois',
    tenant: 'Kouamé Patrick',
    status: 'Actif',
    avatar: 'shared/people/profile-02.webp',
  },
  {
    uid: 'overview-4',
    id: 'UBX-004',
    name: 'résidence Plateau',
    type: 'Appartement',
    location: 'Abidjan, Plateau',
    price: '250 000 FCFA/mois',
    tenant: 'Konan Olivier',
    status: 'Actif',
    avatar: 'shared/people/profile-03.webp',
  },
  {
    uid: 'overview-5',
    id: 'UBX-005',
    name: 'Villa Riviera',
    type: 'Villa',
    location: 'Abidjan, Riviera',
    price: '600 000 FCFA/mois',
    tenant: 'Konan Olivier',
    status: 'Actif',
    avatar: 'shared/people/receipt-guest-01.webp',
  },
  {
    uid: 'overview-6',
    id: 'UBX-001',
    name: 'Immeuble kalia',
    type: 'Appartement',
    location: 'Abidjan, Cocody',
    price: '450 000 FCFA/mois',
    tenant: 'Konan Olivier',
    status: 'Actif',
    avatar: 'shared/people/receipt-guest-02.webp',
  },
  {
    uid: 'overview-7',
    id: 'UBX-002',
    name: 'Villa Riviera',
    type: 'Villa',
    location: 'Abidjan, Riviera',
    price: '600 000 FCFA/mois',
    tenant: 'Koffi Didier',
    status: 'Actif',
    avatar: 'shared/people/receipt-guest-03.webp',
  },
  {
    uid: 'overview-8',
    id: 'UBX-003',
    name: 'Villa Riviera',
    type: 'Villa',
    location: 'Abidjan, Riviera',
    price: '600 000 FCFA/mois',
    tenant: 'Kouamé Patrick',
    status: 'Actif',
    avatar: 'shared/people/receipt-guest-04.webp',
  },
  {
    uid: 'overview-9',
    id: 'UBX-004',
    name: 'résidence Plateau',
    type: 'Appartement',
    location: 'Abidjan, Plateau',
    price: '250 000 FCFA/mois',
    tenant: 'Konan Olivier',
    status: 'Actif',
    avatar: 'shared/people/receipt-guest-05.webp',
  },
  {
    uid: 'overview-10',
    id: 'UBX-005',
    name: 'Villa Riviera',
    type: 'Villa',
    location: 'Abidjan, Riviera',
    price: '600 000 FCFA/mois',
    tenant: 'Konan Olivier',
    status: 'Actif',
    avatar: 'biens/bailleur/tenant-02.webp',
  },
];

const FULL_LIST_PROPERTIES: readonly DashboardPropertyRow[] = Array.from(
  { length: PAGE_SIZE * 5 },
  (_, index) => ({
    uid: `full-${index + 1}`,
    id: 'UBX-001',
    name: 'Immeuble kalia',
    type: 'Appartement',
    location: 'Abidjan, Cocody',
    price: '450 000 FCFA/mois',
    tenant: 'Koné Ibrahim',
    status: 'Actif',
    avatar: 'biens/list/list-tenant-01.webp',
  }),
);

const TRANSACTIONS: readonly DashboardTransaction[] = [
  {
    uid: 'txn-1',
    title: 'Réception paiement Location',
    date: '5 Avril 2026 à 12 : 30',
    customer: 'Koné Ibrahim',
    amount: '+ 450 000 FCFA',
    month: 'Mars 2026',
    logo: 'biens/bailleur/payment-wave.webp',
  },
  {
    uid: 'txn-2',
    title: 'Réception paiement Location',
    date: '2 Avril 2026 à 17 : 41',
    customer: 'Koffi Didier',
    amount: '+ 600 000 FCFA',
    month: 'Mars 2026',
    logo: 'biens/bailleur/payment-orange.webp',
  },
  {
    uid: 'txn-3',
    title: 'Réception paiement Location',
    date: '2 Avril 2026 à 17 : 41',
    customer: 'Konan Olivier',
    amount: '+ 250 000 FCFA',
    month: 'Mars 2026',
    logo: 'biens/bailleur/payment-orange.webp',
  },
  {
    uid: 'txn-4',
    title: 'Réception paiement Location',
    date: '2 Avril 2026 à 17 : 41',
    customer: 'Koffi Didier',
    amount: '+ 600 000 FCFA',
    month: 'Mars 2026',
    logo: 'biens/bailleur/payment-wave.webp',
  },
  {
    uid: 'txn-5',
    title: 'Réception paiement Location',
    date: '5 Avril 2026 à 12 : 30',
    customer: 'Koné Ibrahim',
    amount: '+ 450 000 FCFA',
    month: 'Mars 2026',
    logo: 'biens/bailleur/payment-wave.webp',
  },
  {
    uid: 'txn-6',
    title: 'Réception paiement Location',
    date: '5 Avril 2026 à 12 : 30',
    customer: 'Koné Ibrahim',
    amount: '+ 450 000 FCFA',
    month: 'Mars 2026',
    logo: 'biens/bailleur/payment-wave.webp',
  },
  {
    uid: 'txn-7',
    title: 'Réception paiement Location',
    date: '2 Avril 2026 à 17 : 41',
    customer: 'Koffi Didier',
    amount: '+ 600 000 FCFA',
    month: 'Mars 2026',
    logo: 'biens/bailleur/payment-orange.webp',
  },
  {
    uid: 'txn-8',
    title: 'Réception paiement Location',
    date: '2 Avril 2026 à 17 : 41',
    customer: 'Konan Olivier',
    amount: '+ 250 000 FCFA',
    month: 'Mars 2026',
    logo: 'biens/bailleur/payment-orange.webp',
  },
  {
    uid: 'txn-9',
    title: 'Réception paiement Location',
    date: '2 Avril 2026 à 17 : 41',
    customer: 'Koffi Didier',
    amount: '+ 600 000 FCFA',
    month: 'Mars 2026',
    logo: 'biens/bailleur/payment-wave.webp',
  },
  {
    uid: 'txn-10',
    title: 'Réception paiement Location',
    date: '5 Avril 2026 à 12 : 30',
    customer: 'Koné Ibrahim',
    amount: '+ 450 000 FCFA',
    month: 'Mars 2026',
    logo: 'biens/bailleur/payment-wave.webp',
  },
];

@Component({
  selector: 'ubax-dashboard-dg-page',
  standalone: true,
  imports: [
    RouterLink,
    UbaxPaginatorComponent,
    DateRangePickerComponent,
    UIChart,
  ],
  templateUrl: './dashboard-dg-page.component.html',
  styleUrl: './dashboard-dg-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardDgPageComponent {
  private readonly document = inject(DOCUMENT);

  readonly authStore = inject(AuthStore);
  readonly icons = DASHBOARD_ICONS;
  readonly kpiCards = KPI_CARDS;
  readonly donutLegend = DONUT_LEGEND;
  readonly revenueBars = REVENUE_BARS;
  readonly overviewProperties = OVERVIEW_PROPERTIES;
  readonly transactions = TRANSACTIONS;
  readonly donutChartData: ChartData<'doughnut'> = {
    labels: ['Réservés', 'Occupés', 'Disponibles', 'En maintenance'],
    datasets: [
      {
        data: [12, 9, 6, 2],
        backgroundColor: ['#E87D1E', '#16B55B', '#2388FF', '#FF383C'],
        borderColor: '#FFFFFF',
        borderWidth: 6,
        hoverOffset: 0,
        spacing: 2,
      },
    ],
  };
  readonly donutChartOptions: ChartOptions<'doughnut'> = {
    animation: {
      duration: 650,
    },
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    rotation: (-34 * Math.PI) / 180,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
  };
  readonly revenueChartData: ChartData<'bar'> = {
    labels: REVENUE_BARS.map((bar) => bar.label),
    datasets: [
      {
        data: REVENUE_BARS.map((bar) => bar.value),
        backgroundColor: REVENUE_BARS.map((bar) =>
          bar.highlighted ? '#1A3047' : '#FF8D28',
        ),
        borderSkipped: false,
        borderRadius: 3,
        barThickness: 25,
        maxBarThickness: 25,
        categoryPercentage: 0.74,
        barPercentage: 1,
        stack: 'revenue',
      },
      {
        data: REVENUE_BARS.map((bar) => REVENUE_MAX - bar.value),
        backgroundColor: '#E5E5EF',
        borderSkipped: false,
        borderRadius: 3,
        barThickness: 25,
        maxBarThickness: 25,
        categoryPercentage: 0.74,
        barPercentage: 1,
        stack: 'revenue',
      },
    ],
  };
  readonly revenueChartOptions: ChartOptions<'bar'> = {
    animation: {
      duration: 650,
    },
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    layout: {
      padding: {
        top: 10,
        right: 4,
        bottom: 2,
        left: 4,
      },
    },
    scales: {
      x: {
        stacked: true,
        display: false,
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
      y: {
        stacked: true,
        display: false,
        min: 0,
        max: REVENUE_MAX,
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
    },
  };

  readonly datePickerOpen = signal(false);
  readonly selectedRange = signal<DateRange | null>(null);
  readonly showFullList = signal(false);
  readonly currentPage = signal(3);

  readonly displayName = computed(
    () => this.authStore.fullName() || 'Jean-Marc Kouassi',
  );

  readonly pageTitle = computed(() =>
    this.showFullList() ? 'Liste des biens' : 'Tableau de bord',
  );

  readonly headerDateLabel = computed(() => {
    const range = this.selectedRange();
    if (!range) {
      return 'Sélectionner une date';
    }

    return `${this.formatShortDate(range.start)} - ${this.formatShortDate(range.end)}`;
  });

  readonly totalPages = computed(() =>
    Math.ceil(FULL_LIST_PROPERTIES.length / PAGE_SIZE),
  );

  readonly pagedProperties = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return FULL_LIST_PROPERTIES.slice(start, start + PAGE_SIZE);
  });

  readonly exportRows = computed(() =>
    this.showFullList() ? this.pagedProperties() : this.overviewProperties,
  );

  openDatePicker(): void {
    this.datePickerOpen.set(true);
  }

  onDateRangeApplied(range: DateRange): void {
    this.selectedRange.set(range);
  }

  toggleFullList(): void {
    const nextState = !this.showFullList();
    const applyState = () => {
      this.showFullList.set(nextState);

      if (nextState) {
        this.currentPage.set(3);
      }
    };

    if ('startViewTransition' in this.document) {
      this.document.startViewTransition(() => applyState());
      return;
    }

    applyState();
  }

  exportVisibleRows(): void {
    const currentWindow = this.document.defaultView;

    if (!currentWindow) {
      return;
    }

    const lines = [
      'ID;Nom du bien;Type;Localisation;Prix;Locataires;Statut',
      ...this.exportRows().map((row) =>
        [
          row.id,
          row.name,
          row.type,
          row.location,
          row.price,
          row.tenant,
          row.status,
        ].join(';'),
      ),
    ];

    const blob = new Blob([lines.join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = currentWindow.URL.createObjectURL(blob);
    const link = this.document.createElement('a');

    link.href = url;
    link.download = this.showFullList()
      ? 'dashboard-dg-liste-biens.csv'
      : 'dashboard-dg-overview.csv';

    this.document.body.append(link);
    link.click();
    link.remove();
    currentWindow.URL.revokeObjectURL(url);
  }

  private formatShortDate(date: Date): string {
    const day = `${date.getDate()}`.padStart(2, '0');
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const year = `${date.getFullYear()}`.slice(-2);

    return `${day}/${month}/${year}`;
  }
}
