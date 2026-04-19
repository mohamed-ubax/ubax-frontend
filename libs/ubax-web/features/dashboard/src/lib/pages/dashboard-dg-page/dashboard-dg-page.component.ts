import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access';
import {
  DateRange,
  DateRangePickerComponent,
  UbaxPaginatorComponent,
} from '@ubax-workspace/shared-ui';

interface DashboardKpiCard {
  readonly label: string;
  readonly value: string;
  readonly trend?: string;
  readonly tone: 'all' | 'active' | 'rented' | 'sold';
  readonly iconClass: string;
}

interface DashboardPropertyRow {
  readonly uid: string;
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly location: string;
  readonly price: string;
  readonly tenant: string;
  readonly status: string;
  readonly avatar: string;
}

interface DashboardDonutLegendItem {
  readonly count: number;
  readonly label: string;
  readonly tone: 'occupied' | 'available' | 'reserved' | 'maintenance';
}

interface DashboardRevenueBar {
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
  readonly highlighted?: boolean;
}

interface DashboardTransaction {
  readonly uid: string;
  readonly title: string;
  readonly date: string;
  readonly customer: string;
  readonly amount: string;
  readonly month: string;
  readonly logo: string;
}

const PAGE_SIZE = 8;

const DASHBOARD_ICONS = {
  search: 'archivages/commercial/icons/search.webp',
  calendar: 'archivages/commercial/icons/calendar-toolbar.webp',
  export: 'archivages/commercial/icons/export.webp',
  chevronDown: 'archivages/commercial/icons/chevron-down.webp',
  eye: 'shared/demandes/action-eye.webp',
  paginatorPrevious: 'archivages/commercial/icons/paginator-previous.webp',
  paginatorNext: 'archivages/commercial/icons/paginator-next.webp',
} as const;

const KPI_CARDS: readonly DashboardKpiCard[] = [
  {
    label: 'Tous les biens',
    value: '45',
    trend: '+2%',
    tone: 'all',
    iconClass: 'pi pi-home',
  },
  {
    label: 'Annonces actives',
    value: '10',
    tone: 'active',
    iconClass: 'pi pi-arrow-up-right',
  },
  {
    label: 'Biens Loués',
    value: '33',
    tone: 'rented',
    iconClass: 'pi pi-key',
  },
  {
    label: 'Biens Vendus',
    value: '2',
    tone: 'sold',
    iconClass: 'pi pi-check-square',
  },
];

const DONUT_LEGEND: readonly DashboardDonutLegendItem[] = [
  { count: 9, label: 'Occupés', tone: 'occupied' },
  { count: 6, label: 'Disponibles', tone: 'available' },
  { count: 12, label: 'Réservés', tone: 'reserved' },
  { count: 2, label: 'En maintenance', tone: 'maintenance' },
];

const REVENUE_BARS: readonly DashboardRevenueBar[] = [
  { label: 'JAN', slug: 'jan' },
  { label: 'FEV', slug: 'fev' },
  { label: 'MAR', slug: 'mar' },
  { label: 'AVR', slug: 'avr' },
  { label: 'MAI', slug: 'mai' },
  { label: 'JUI', slug: 'jui-1', highlighted: true },
  { label: 'JUI', slug: 'jui-2' },
  { label: 'AOU', slug: 'aou' },
  { label: 'SEP', slug: 'sep' },
  { label: 'OCT', slug: 'oct' },
  { label: 'NOV', slug: 'nov' },
  { label: 'DEC', slug: 'dec' },
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
  imports: [RouterLink, UbaxPaginatorComponent, DateRangePickerComponent],
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
    this.showFullList.set(nextState);

    if (nextState) {
      this.currentPage.set(3);
    }
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
