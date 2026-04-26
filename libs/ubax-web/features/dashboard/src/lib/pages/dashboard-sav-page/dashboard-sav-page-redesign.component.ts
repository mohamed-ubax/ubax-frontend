import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { ChartData, ChartOptions } from 'chart.js';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import {
  LazyChartComponent,
  UbaxPaginatorComponent,
} from '@ubax-workspace/shared-ui';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access';

type DashboardSavStatusTone = 'open' | 'progress' | 'success';
type DashboardSavPriorityTone = 'urgent' | 'normal';
type DashboardSavNotificationTone = 'alert' | 'ticket' | 'success' | 'water';
type DashboardSavTicketStatusFilter = 'all' | DashboardSavStatusTone;
type DashboardSavTicketPriorityFilter = 'all' | DashboardSavPriorityTone;
type DashboardSavInterventionPeriod = 'current-month' | 'quarter' | 'year';
type DashboardSavStarTone = 'full' | 'half';

interface DashboardSavSelectOption<TValue> {
  readonly label: string;
  readonly value: TValue;
}

interface DashboardSavTicketFilterState {
  readonly status: DashboardSavTicketStatusFilter;
  readonly priority: DashboardSavTicketPriorityFilter;
  readonly issue: string;
  readonly createdAt: Date | null;
}

interface DashboardSavTicket {
  readonly id: string;
  readonly client: string;
  readonly avatar: string;
  readonly property: string;
  readonly issue: string;
  readonly issueKey: string;
  readonly priority: string;
  readonly priorityTone: DashboardSavPriorityTone;
  readonly createdAtLabel: string;
  readonly createdAtDate: Date;
  readonly status: string;
  readonly statusTone: DashboardSavStatusTone;
}

interface DashboardSavSummaryMetric {
  readonly label: string;
  readonly value: number;
  readonly background: string;
  readonly accent: string;
  readonly orbSrc: string;
  readonly iconSrc: string;
}

interface DashboardSavNotificationItem {
  readonly id: string;
  readonly title: string;
  readonly property: string;
  readonly ticketId: string;
  readonly time: string;
  readonly createdAt: Date;
  readonly tone: DashboardSavNotificationTone;
  readonly iconBackground: string;
  readonly iconSrc: string;
  readonly accent: string;
}

interface DashboardSavInterventionSnapshot {
  readonly pending: number;
  readonly progress: number;
  readonly completed: number;
}

interface DashboardSavTechnician {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly specialty: string;
  readonly rating: number;
  readonly tickets: number;
  readonly phone: string;
  readonly color: string;
  readonly image: string;
}

interface DashboardSavTechIntervention {
  readonly id: string;
  readonly client: string;
  readonly property: string;
  readonly issue: string;
  readonly priority: string;
  readonly status: string;
  readonly date: string;
}

const SHARED_ASSET_ROOT = '/shared/demandes';
const DASHBOARD_SAV_ASSET_ROOT = '/dashboard-sav';
const TECHNICIAN_AVATAR_COUNT = 8;
const DEFAULT_VISIBLE_TECHNICIANS = 5;
const DEFAULT_VISIBLE_NOTIFICATIONS = 5;
const TICKETS_PER_PAGE = 4;

const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const replaceText = (
  value: string,
  pattern: RegExp,
  replacement: string,
): string =>
  (
    String.prototype.replace as (
      this: string,
      searchValue: RegExp,
      replaceValue: string,
    ) => string
  ).call(value, pattern, replacement);

const STATUS_LABELS: Record<DashboardSavStatusTone, string> = {
  open: 'Ouvert',
  progress: 'en cours',
  success: 'Résolu',
};

const KPI_TONES = {
  open: {
    accent: 'var(--ubax-info)',
    background: 'var(--ubax-info-soft-card)',
    orbSrc: dashboardSavAsset('kpi/orb-open.webp'),
    iconSrc: dashboardSavAsset('kpi/icon-open.webp'),
  },
  progress: {
    accent: 'var(--ubax-accent)',
    background: 'var(--ubax-accent-soft-card)',
    orbSrc: dashboardSavAsset('kpi/orb-progress.webp'),
    iconSrc: dashboardSavAsset('kpi/icon-progress.webp'),
  },
  success: {
    accent: 'var(--ubax-success)',
    background: 'var(--ubax-success-soft-card)',
    orbSrc: dashboardSavAsset('kpi/orb-done.webp'),
    iconSrc: dashboardSavAsset('kpi/icon-done.webp'),
  },
  urgent: {
    accent: 'var(--ubax-danger)',
    background: 'var(--ubax-danger-soft-card)',
    orbSrc: dashboardSavAsset('kpi/orb-urgent.webp'),
    iconSrc: dashboardSavAsset('kpi/icon-urgent.webp'),
  },
} as const;

const INTERVENTION_SNAPSHOTS: Record<
  DashboardSavInterventionPeriod,
  DashboardSavInterventionSnapshot
> = {
  'current-month': {
    pending: 12,
    progress: 21,
    completed: 15,
  },
  quarter: {
    pending: 18,
    progress: 27,
    completed: 24,
  },
  year: {
    pending: 41,
    progress: 66,
    completed: 58,
  },
};

const STAR_ASSET_BY_TONE: Record<DashboardSavStarTone, string> = {
  full: dashboardSavAsset('technicians/star-full.webp'),
  half: dashboardSavAsset('technicians/star-half.webp'),
};

const TICKET_CLIENTS = [
  {
    name: 'Konan Olivier',
    avatar: dashboardSavAsset('tickets/avatar-01.webp'),
  },
  {
    name: 'Awa Bakayoko',
    avatar: dashboardSavAsset('tickets/avatar-02.webp'),
  },
  {
    name: 'Moussa Traoré',
    avatar: dashboardSavAsset('tickets/avatar-03.webp'),
  },
  {
    name: 'Mariam Coulibaly',
    avatar: dashboardSavAsset('tickets/avatar-04.webp'),
  },
] as const;

const TICKET_PROPERTIES = [
  'résidence Plateau - App 12',
  'Résidence Plateau - App 22',
  'Immeuble kalia',
  'Villa Riviera',
  'Les Jardins de Cocody',
  'Résidence Palm Club - App 06',
] as const;

const TICKET_ISSUES = [
  'Fuite d’eau',
  'Problème électrique',
  'Porte cassée',
  'Climatisation défaillante',
  'Serrure bloquée',
  'Panne ascenseur',
] as const;

const BASE_TECHNICIANS: readonly DashboardSavTechnician[] = [
  {
    id: 'UBX-TECH-001',
    name: 'Mamadou Diallo',
    initials: 'MD',
    specialty: 'Électricité bâtiment',
    rating: 4.5,
    tickets: 2,
    phone: '+225 07 58 42 19 63',
    color: '#1a3047',
    image: dashboardSavAsset('technicians/avatar-05.webp'),
  },
  {
    id: 'UBX-TECH-002',
    name: 'Serge Kouamé',
    initials: 'SK',
    specialty: 'Plomberie & sanitaires',
    rating: 4.5,
    tickets: 0,
    phone: '+225 07 58 42 19 63',
    color: '#e87d1e',
    image: dashboardSavAsset('technicians/avatar-03.webp'),
  },
  {
    id: 'UBX-TECH-003',
    name: 'Alain Yao',
    initials: 'AY',
    specialty: 'Maintenance générale',
    rating: 4.5,
    tickets: 2,
    phone: '+225 07 58 42 19 63',
    color: '#16b55b',
    image: dashboardSavAsset('technicians/avatar-04.webp'),
  },
  {
    id: 'UBX-TECH-004',
    name: 'Patrick N’Guessan',
    initials: 'PN',
    specialty: 'Peintre',
    rating: 4.5,
    tickets: 1,
    phone: '+225 07 58 42 19 63',
    color: '#e87d1e',
    image: dashboardSavAsset('technicians/avatar-02.webp'),
  },
  {
    id: 'UBX-TECH-005',
    name: 'Moussa Ba',
    initials: 'MB',
    specialty: 'Électricité bâtiment',
    rating: 4.5,
    tickets: 2,
    phone: '+225 07 58 42 19 63',
    color: '#1a3047',
    image: dashboardSavAsset('technicians/avatar-06.webp'),
  },
  {
    id: 'UBX-TECH-006',
    name: 'Kofi Mensah',
    initials: 'KM',
    specialty: 'Climatisation',
    rating: 4,
    tickets: 3,
    phone: '+225 07 58 42 19 63',
    color: '#e87d1e',
    image: dashboardSavAsset('technicians/avatar-07.webp'),
  },
  {
    id: 'UBX-TECH-007',
    name: 'Adjoua Traoré',
    initials: 'AT',
    specialty: 'Menuiserie',
    rating: 4.5,
    tickets: 1,
    phone: '+225 07 58 42 19 63',
    color: '#16b55b',
    image: dashboardSavAsset('technicians/avatar-08.webp'),
  },
  {
    id: 'UBX-TECH-008',
    name: 'Boubacar Diallo',
    initials: 'BD',
    specialty: 'Maintenance générale',
    rating: 4,
    tickets: 2,
    phone: '+225 07 58 42 19 63',
    color: '#1a3047',
    image: dashboardSavAsset('technicians/avatar-01.webp'),
  },
] as const;

const TECH_HISTORY: readonly DashboardSavTechIntervention[] = [
  {
    id: 'UBX-TK-0012',
    client: 'Koffi Didier',
    property: 'Résidence Plateau - App 12 / Abidjan, Riviera',
    issue: 'Problème électrique',
    priority: 'Urgent',
    status: 'Résolu',
    date: '05/03/2026',
  },
  {
    id: 'UBX-TK-0030',
    client: 'Kouamé Patrick',
    property: 'Résidence Plateau - App 13 / Abidjan, Riviera',
    issue: 'Problème électrique',
    priority: 'Urgent',
    status: 'Résolu',
    date: '08/03/2026',
  },
  {
    id: 'UBX-TK-0014',
    client: 'Konan Olivier',
    property: 'Villa Riviera / Abidjan, Riviera',
    issue: 'Fuite d’eau',
    priority: 'Normal',
    status: 'Résolu',
    date: '10/03/2026',
  },
  {
    id: 'UBX-TK-0056',
    client: 'Mariam Coulibaly',
    property: 'Résidence Plateau - App 22 / Abidjan, Plateau',
    issue: 'Porte cassée',
    priority: 'Normal',
    status: 'Résolu',
    date: '15/03/2026',
  },
];

const BASE_NOTIFICATIONS: readonly DashboardSavNotificationItem[] = [
  {
    id: 'notification-01',
    title: 'Fuite d’eau',
    property: 'Résidence Plateau - App 12',
    ticketId: 'UBX-TK-0012',
    time: 'Il y’a 5 minutes',
    createdAt: createMockDate(5),
    tone: 'alert',
    iconBackground: dashboardSavAsset('notifications/bg-alert.webp'),
    iconSrc: dashboardSavAsset('notifications/icon-alert.webp'),
    accent: 'var(--ubax-danger)',
  },
  {
    id: 'notification-02',
    title: 'Porte cassée',
    property: 'Villa Riviera',
    ticketId: 'UBX-TK-0052',
    time: 'Il y’a 12 minutes',
    createdAt: createMockDate(5),
    tone: 'ticket',
    iconBackground: dashboardSavAsset('notifications/bg-ticket.webp'),
    iconSrc: dashboardSavAsset('notifications/icon-ticket.webp'),
    accent: 'var(--ubax-info)',
  },
  {
    id: 'notification-03',
    title: 'Problème électrique',
    property: 'Immeuble kalia',
    ticketId: 'UBX-TK-0015',
    time: 'Il y’a 15 minutes',
    createdAt: createMockDate(6),
    tone: 'success',
    iconBackground: dashboardSavAsset('notifications/bg-success.webp'),
    iconSrc: dashboardSavAsset('notifications/icon-success.webp'),
    accent: 'var(--ubax-success-emphasis)',
  },
  {
    id: 'notification-04',
    title: 'Fuite d’eau',
    property: 'Résidence Plateau - App 22',
    ticketId: 'UBX-TK-0172',
    time: 'Il y’a 17 minutes',
    createdAt: createMockDate(7),
    tone: 'water',
    iconBackground: dashboardSavAsset('notifications/bg-water.webp'),
    iconSrc: dashboardSavAsset('notifications/icon-ticket.webp'),
    accent: 'var(--ubax-info)',
  },
  {
    id: 'notification-05',
    title: 'Problème électrique',
    property: 'Immeuble kalia',
    ticketId: 'UBX-TK-0015',
    time: 'Il y’a 25 minutes',
    createdAt: createMockDate(8),
    tone: 'success',
    iconBackground: dashboardSavAsset('notifications/bg-success.webp'),
    iconSrc: dashboardSavAsset('notifications/icon-success.webp'),
    accent: 'var(--ubax-success-emphasis)',
  },
  {
    id: 'notification-06',
    title: 'Fuite d’eau',
    property: 'Résidence Palm Club - App 06',
    ticketId: 'UBX-TK-0111',
    time: 'Il y’a 39 minutes',
    createdAt: createMockDate(9),
    tone: 'alert',
    iconBackground: dashboardSavAsset('notifications/bg-alert.webp'),
    iconSrc: dashboardSavAsset('notifications/icon-alert.webp'),
    accent: 'var(--ubax-danger)',
  },
];

function dashboardSavAsset(file: string): string {
  return `${DASHBOARD_SAV_ASSET_ROOT}/${file}`;
}

function createMockDate(day: number): Date {
  return new Date(2026, 2, day, 9, 0, 0, 0);
}

function formatMockDate(date: Date): string {
  return DATE_FORMATTER.format(date);
}

function normalizeText(value: string): string {
  return replaceText(value.normalize('NFD'), /[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function isSameCalendarDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function cloneDate(date: Date | null): Date | null {
  return date ? new Date(date) : null;
}

function createDefaultTicketFilters(): DashboardSavTicketFilterState {
  return {
    status: 'all',
    priority: 'all',
    issue: 'all',
    createdAt: null,
  };
}

function areFilterDatesEqual(left: Date | null, right: Date | null): boolean {
  if (!left || !right) {
    return left === right;
  }

  return isSameCalendarDay(left, right);
}

function areTicketFiltersEqual(
  left: DashboardSavTicketFilterState,
  right: DashboardSavTicketFilterState,
): boolean {
  return (
    left.status === right.status &&
    left.priority === right.priority &&
    left.issue === right.issue &&
    areFilterDatesEqual(left.createdAt, right.createdAt)
  );
}

function buildTicket(
  sequence: number,
  statusTone: DashboardSavStatusTone,
  priorityTone: DashboardSavPriorityTone,
  issue: string,
  client: (typeof TICKET_CLIENTS)[number],
  property: string,
  day: number,
): DashboardSavTicket {
  const createdAtDate = createMockDate(day);

  return {
    id: `UBX-TK-${String(sequence).padStart(4, '0')}`,
    client: client.name,
    avatar: client.avatar,
    property,
    issue,
    issueKey: issue,
    priority: priorityTone === 'urgent' ? 'Urgent' : 'normal',
    priorityTone,
    createdAtLabel: formatMockDate(createdAtDate),
    createdAtDate,
    status: STATUS_LABELS[statusTone],
    statusTone,
  };
}

const BASE_TICKETS: readonly DashboardSavTicket[] = [
  {
    id: 'UBX-TK-0012',
    client: 'Konan Olivier',
    avatar: dashboardSavAsset('tickets/avatar-01.webp'),
    property: 'résidence Plateau - App 12',
    issue: 'Fuite d’eau',
    issueKey: 'Fuite d’eau',
    priority: 'Urgent',
    priorityTone: 'urgent',
    createdAtLabel: '05/03/2026',
    createdAtDate: createMockDate(5),
    status: 'Résolu',
    statusTone: 'success',
  },
  {
    id: 'UBX-TK-0012-B',
    client: 'Awa Bakayoko',
    avatar: dashboardSavAsset('tickets/avatar-02.webp'),
    property: 'résidence Plateau - App 12',
    issue: 'Problème électrique',
    issueKey: 'Problème électrique',
    priority: 'Urgent',
    priorityTone: 'urgent',
    createdAtLabel: '05/03/2026',
    createdAtDate: createMockDate(5),
    status: 'Résolu',
    statusTone: 'success',
  },
  {
    id: 'UBX-TK-0012-C',
    client: 'Moussa Traoré',
    avatar: dashboardSavAsset('tickets/avatar-03.webp'),
    property: 'résidence Plateau - App 12',
    issue: 'Fuite d’eau',
    issueKey: 'Fuite d’eau',
    priority: 'normal',
    priorityTone: 'normal',
    createdAtLabel: '05/03/2026',
    createdAtDate: createMockDate(5),
    status: 'en cours',
    statusTone: 'progress',
  },
  {
    id: 'UBX-TK-0012-D',
    client: 'Mariam Coulibaly',
    avatar: dashboardSavAsset('tickets/avatar-04.webp'),
    property: 'résidence Plateau - App 12',
    issue: 'Porte cassée',
    issueKey: 'Porte cassée',
    priority: 'Urgent',
    priorityTone: 'urgent',
    createdAtLabel: '05/03/2026',
    createdAtDate: createMockDate(5),
    status: 'Résolu',
    statusTone: 'success',
  },
];

const OPEN_TICKETS: readonly DashboardSavTicket[] = Array.from(
  { length: 22 },
  (_, index) =>
    buildTicket(
      100 + index,
      'open',
      index < 2 ? 'urgent' : 'normal',
      TICKET_ISSUES[index % TICKET_ISSUES.length],
      TICKET_CLIENTS[index % TICKET_CLIENTS.length],
      TICKET_PROPERTIES[index % TICKET_PROPERTIES.length],
      6 + (index % 12),
    ),
);

const PROGRESS_TICKETS: readonly DashboardSavTicket[] = Array.from(
  { length: 4 },
  (_, index) =>
    buildTicket(
      200 + index,
      'progress',
      'normal',
      TICKET_ISSUES[(index + 2) % TICKET_ISSUES.length],
      TICKET_CLIENTS[index % TICKET_CLIENTS.length],
      TICKET_PROPERTIES[(index + 1) % TICKET_PROPERTIES.length],
      10 + index,
    ),
);

const SUCCESS_TICKETS: readonly DashboardSavTicket[] = Array.from(
  { length: 12 },
  (_, index) =>
    buildTicket(
      300 + index,
      'success',
      index % 3 === 0 ? 'urgent' : 'normal',
      TICKET_ISSUES[(index + 1) % TICKET_ISSUES.length],
      TICKET_CLIENTS[(index + 1) % TICKET_CLIENTS.length],
      TICKET_PROPERTIES[(index + 2) % TICKET_PROPERTIES.length],
      2 + (index % 11),
    ),
);

const ALL_TICKETS: readonly DashboardSavTicket[] = [
  ...BASE_TICKETS,
  ...OPEN_TICKETS,
  ...PROGRESS_TICKETS,
  ...SUCCESS_TICKETS,
];

@Component({
  selector: 'ubax-dashboard-sav-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePickerModule,
    SelectModule,
    LazyChartComponent,
    UbaxPaginatorComponent,
  ],
  templateUrl: './dashboard-sav-page-redesign.component.html',
  styleUrl: './dashboard-sav-page-redesign.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSavPageComponent {
  readonly authStore = inject(AuthStore);
  private readonly document = inject(DOCUMENT);

  readonly sharedIcons = {
    search: `${SHARED_ASSET_ROOT}/filter-search.webp`,
    date: `${SHARED_ASSET_ROOT}/filter-date.webp`,
    export: `${SHARED_ASSET_ROOT}/filter-export.webp`,
    chevron: `${SHARED_ASSET_ROOT}/select-chevron.webp`,
  };

  readonly heroAddTechnicianIcon = dashboardSavAsset(
    'hero/add-technician.webp',
  );
  readonly technicianTicketIcon = dashboardSavAsset('technicians/ticket.webp');
  readonly technicianPhoneIcon = dashboardSavAsset('technicians/phone.webp');

  readonly toolbarSearchTerm = signal('');
  readonly toolbarSelectedDate = signal<Date | null>(null);
  readonly tableSearchTerm = signal('');
  readonly directorySearchTerm = signal('');
  readonly ticketsCurrentPage = signal(1);
  readonly showAllNotifications = signal(false);
  readonly showAllTechnicians = signal(false);
  readonly transitionPhase = signal<'idle' | 'to-directory' | 'to-dashboard'>(
    'idle',
  );
  readonly selectedInterventionPeriod =
    signal<DashboardSavInterventionPeriod>('current-month');

  readonly draftStatus = signal<DashboardSavTicketStatusFilter>('all');
  readonly draftPriority = signal<DashboardSavTicketPriorityFilter>('all');
  readonly draftIssue = signal<string>('all');
  readonly draftCreatedAt = signal<Date | null>(null);

  readonly appliedFilters = signal<DashboardSavTicketFilterState>(
    createDefaultTicketFilters(),
  );

  readonly technicians = signal<DashboardSavTechnician[]>([
    ...BASE_TECHNICIANS,
  ]);

  readonly addTechOpen = signal(false);
  readonly addTechClosing = signal(false);
  readonly newPrenom = signal('');
  readonly newNom = signal('');
  readonly newPhone = signal('');
  readonly newSpecialty = signal('Plomberie & sanitaires');
  readonly newPayment = signal('Espèces');
  readonly newPhotoUrl = signal<string | null>(null);
  private photoObjectUrl: string | null = null;

  readonly specialties = [
    'Plomberie & sanitaires',
    'Électricité bâtiment',
    'Maintenance générale',
    'Peinture',
    'Menuiserie',
    'Climatisation',
  ];

  readonly paymentMethods = ['Espèces', 'Virement', 'Mobile Money', 'Chèque'];

  readonly userFullName = computed(() => {
    const user = this.authStore.user();
    const fullName = `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim();
    return fullName || 'Ibrahim Konaté';
  });

  readonly pageTitle = computed(() =>
    this.showAllTechnicians() ? 'liste des techniciens' : 'Tableau de bord',
  );

  readonly statusOptions: DashboardSavSelectOption<DashboardSavTicketStatusFilter>[] =
    [
      { label: 'Statut', value: 'all' },
      { label: 'Tickets ouverts', value: 'open' },
      { label: 'Traitement en cours', value: 'progress' },
      { label: 'Tickets résolus', value: 'success' },
    ];

  readonly priorityOptions: DashboardSavSelectOption<DashboardSavTicketPriorityFilter>[] =
    [
      { label: 'Priorité', value: 'all' },
      { label: 'Urgent', value: 'urgent' },
      { label: 'Normal', value: 'normal' },
    ];

  readonly issueOptions: DashboardSavSelectOption<string>[] = [
    { label: 'Type de problème', value: 'all' },
    ...Array.from(new Set(ALL_TICKETS.map((ticket) => ticket.issueKey))).map(
      (issue) => ({
        label: issue,
        value: issue,
      }),
    ),
  ];

  readonly interventionPeriodOptions: DashboardSavSelectOption<DashboardSavInterventionPeriod>[] =
    [
      { label: 'Mois en cours', value: 'current-month' },
      { label: 'Trimestre', value: 'quarter' },
      { label: 'Année', value: 'year' },
    ];

  readonly scopedTickets = computed(() => {
    const query = normalizeText(this.toolbarSearchTerm());
    const selectedDate = this.toolbarSelectedDate();
    const filters = this.appliedFilters();

    return ALL_TICKETS.filter((ticket) => {
      if (query) {
        const searchableText = normalizeText(
          [
            ticket.id,
            ticket.client,
            ticket.property,
            ticket.issue,
            ticket.priority,
            ticket.status,
          ].join(' '),
        );

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      if (
        selectedDate &&
        !isSameCalendarDay(ticket.createdAtDate, selectedDate)
      ) {
        return false;
      }

      if (filters.status !== 'all' && ticket.statusTone !== filters.status) {
        return false;
      }

      if (
        filters.priority !== 'all' &&
        ticket.priorityTone !== filters.priority
      ) {
        return false;
      }

      if (filters.issue !== 'all' && ticket.issueKey !== filters.issue) {
        return false;
      }

      if (
        filters.createdAt &&
        !isSameCalendarDay(ticket.createdAtDate, filters.createdAt)
      ) {
        return false;
      }

      return true;
    });
  });

  readonly visibleTickets = computed(() => {
    const query = normalizeText(this.tableSearchTerm());

    if (!query) {
      return this.scopedTickets();
    }

    return this.scopedTickets().filter((ticket) =>
      normalizeText(
        [
          ticket.id,
          ticket.client,
          ticket.property,
          ticket.issue,
          ticket.priority,
          ticket.status,
        ].join(' '),
      ).includes(query),
    );
  });

  readonly ticketTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.visibleTickets().length / TICKETS_PER_PAGE)),
  );

  readonly paginatedTickets = computed(() => {
    const currentPage = Math.min(
      this.ticketsCurrentPage(),
      this.ticketTotalPages(),
    );
    const start = (currentPage - 1) * TICKETS_PER_PAGE;

    return this.visibleTickets().slice(start, start + TICKETS_PER_PAGE);
  });

  readonly ticketResultsLabel = computed(() => {
    const total = this.visibleTickets().length;

    if (!total) {
      return 'Affichage de 0 sur 0 résultats';
    }

    const currentPage = Math.min(
      this.ticketsCurrentPage(),
      this.ticketTotalPages(),
    );
    const start = (currentPage - 1) * TICKETS_PER_PAGE + 1;
    const end = Math.min(start + TICKETS_PER_PAGE - 1, total);

    return `Affichage de ${start} à ${end} sur ${total} résultats`;
  });

  readonly statCards = computed<readonly DashboardSavSummaryMetric[]>(() => {
    const tickets = this.scopedTickets();
    const activeUrgentCount = tickets.filter(
      (ticket) =>
        ticket.priorityTone === 'urgent' && ticket.statusTone !== 'success',
    ).length;

    return [
      {
        label: 'Tickets ouverts',
        value: tickets.filter((ticket) => ticket.statusTone === 'open').length,
        ...KPI_TONES.open,
      },
      {
        label: 'En cours d’intervention',
        value: tickets.filter((ticket) => ticket.statusTone === 'progress')
          .length,
        ...KPI_TONES.progress,
      },
      {
        label: 'Tickets résolus',
        value: tickets.filter((ticket) => ticket.statusTone === 'success')
          .length,
        ...KPI_TONES.success,
      },
      {
        label: 'Tickets Urgents',
        value: activeUrgentCount,
        ...KPI_TONES.urgent,
      },
    ];
  });

  readonly visibleNotifications = computed(() => {
    const query = normalizeText(this.toolbarSearchTerm());
    const selectedDate = this.toolbarSelectedDate();

    return BASE_NOTIFICATIONS.filter((item) => {
      if (query) {
        const searchableText = normalizeText(
          [item.title, item.property, item.ticketId, item.time].join(' '),
        );

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return !selectedDate || isSameCalendarDay(item.createdAt, selectedDate);
    });
  });

  readonly displayedNotifications = computed(() => {
    const items = this.visibleNotifications();
    return this.showAllNotifications()
      ? items
      : items.slice(0, DEFAULT_VISIBLE_NOTIFICATIONS);
  });

  readonly filteredTechnicians = computed(() => {
    const globalQuery = normalizeText(this.toolbarSearchTerm());
    const directoryQuery = normalizeText(this.directorySearchTerm());

    return this.technicians().filter((technician) => {
      const searchableText = normalizeText(
        [
          technician.name,
          technician.specialty,
          technician.phone,
          technician.id,
        ].join(' '),
      );

      if (globalQuery && !searchableText.includes(globalQuery)) {
        return false;
      }

      if (directoryQuery && !searchableText.includes(directoryQuery)) {
        return false;
      }

      return true;
    });
  });

  readonly displayedTechnicians = computed(() => {
    const technicians = this.filteredTechnicians();
    return this.showAllTechnicians()
      ? technicians
      : technicians.slice(0, DEFAULT_VISIBLE_TECHNICIANS);
  });

  readonly selectedInterventionSnapshot = computed(
    () => INTERVENTION_SNAPSHOTS[this.selectedInterventionPeriod()],
  );

  readonly interventionsChartData = computed<ChartData<'doughnut'>>(() => {
    const snapshot = this.selectedInterventionSnapshot();

    return {
      labels: ['En attente', 'En cours', 'Terminés'],
      datasets: [
        {
          data: [snapshot.pending, snapshot.progress, snapshot.completed],
          backgroundColor: ['#008bff', '#e87d1e', '#16b55b'],
          borderWidth: 0,
          hoverOffset: 0,
          spacing: 2,
          borderRadius: 14,
        },
      ],
    };
  });

  readonly interventionsChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    rotation: -90,
    circumference: 180,
    cutout: '75%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
    },
  };

  readonly interventionLegend = computed(() => {
    const snapshot = this.selectedInterventionSnapshot();

    return [
      {
        label: 'En attente',
        count: snapshot.pending,
        color: '#008bff',
      },
      {
        label: 'En cours',
        count: snapshot.progress,
        color: '#e87d1e',
      },
      {
        label: 'Terminés',
        count: snapshot.completed,
        color: '#16b55b',
      },
    ];
  });

  readonly interventionsTotal = computed(() => {
    const snapshot = this.selectedInterventionSnapshot();
    return snapshot.pending + snapshot.progress + snapshot.completed;
  });

  readonly notificationToggleLabel = computed(() =>
    this.showAllNotifications() ? 'Réduire' : 'Voir plus',
  );

  readonly technicianToggleLabel = computed(() =>
    this.showAllTechnicians() ? 'Réduire' : 'Voir plus',
  );

  readonly canToggleNotifications = computed(
    () => this.visibleNotifications().length > DEFAULT_VISIBLE_NOTIFICATIONS,
  );

  readonly canToggleTechnicians = computed(
    () => this.filteredTechnicians().length > DEFAULT_VISIBLE_TECHNICIANS,
  );

  readonly starIcons = computed(() => STAR_ASSET_BY_TONE);

  openAddTech(): void {
    this.addTechOpen.set(true);
    this.document.body.style.setProperty('overflow', 'hidden');
  }

  closeAddTech(): void {
    this.addTechClosing.set(true);
    this.document.body.style.removeProperty('overflow');
    setTimeout(() => {
      this.addTechOpen.set(false);
      this.addTechClosing.set(false);
      this.resetPhotoState();
    }, 220);
  }

  handlePhotoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const defaultView = this.document.defaultView;

    if (!defaultView) {
      return;
    }

    if (this.photoObjectUrl) {
      defaultView.URL.revokeObjectURL(this.photoObjectUrl);
    }

    this.photoObjectUrl = defaultView.URL.createObjectURL(file);
    this.newPhotoUrl.set(this.photoObjectUrl);
  }

  saveTech(): void {
    const prenom = this.newPrenom().trim();
    const nom = this.newNom().trim();
    const phone = this.newPhone().trim();

    if (!prenom || !nom || !phone) {
      return;
    }

    const nextIndex = this.technicians().length + 1;
    const avatarIndex = ((nextIndex - 1) % TECHNICIAN_AVATAR_COUNT) + 1;
    const id = `UBX-TECH-${String(nextIndex).padStart(3, '0')}`;
    const name = `${prenom} ${nom}`;
    const initials = `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase();
    const image =
      this.newPhotoUrl() ??
      dashboardSavAsset(
        `technicians/avatar-${String(avatarIndex).padStart(2, '0')}.webp`,
      );

    this.technicians.update((technicians) => [
      {
        id,
        name,
        initials,
        specialty: this.newSpecialty(),
        rating: 4.5,
        tickets: 0,
        phone,
        color: 'var(--ubax-navy)',
        image,
      },
      ...technicians,
    ]);

    this.newPrenom.set('');
    this.newNom.set('');
    this.newPhone.set('');
    this.newSpecialty.set('Plomberie & sanitaires');
    this.newPayment.set('Espèces');
    this.photoObjectUrl = null;
    this.newPhotoUrl.set(null);
    this.closeAddTech();
  }

  private resetPhotoState(): void {
    const defaultView = this.document.defaultView;

    if (this.photoObjectUrl && defaultView) {
      defaultView.URL.revokeObjectURL(this.photoObjectUrl);
    }

    this.photoObjectUrl = null;
    this.newPhotoUrl.set(null);
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }

  applyTicketFilters(): void {
    this.appliedFilters.set({
      status: this.draftStatus(),
      priority: this.draftPriority(),
      issue: this.draftIssue(),
      createdAt: cloneDate(this.draftCreatedAt()),
    });
    this.resetTicketsPage();
  }

  clearTicketFilters(): void {
    const defaultFilters = createDefaultTicketFilters();

    this.draftStatus.set(defaultFilters.status);
    this.draftPriority.set(defaultFilters.priority);
    this.draftIssue.set(defaultFilters.issue);
    this.draftCreatedAt.set(defaultFilters.createdAt);
    this.appliedFilters.set(defaultFilters);
    this.toolbarSearchTerm.set('');
    this.toolbarSelectedDate.set(null);
    this.tableSearchTerm.set('');
    this.directorySearchTerm.set('');
    this.showAllNotifications.set(false);
    this.showAllTechnicians.set(false);
    this.resetTicketsPage();
  }

  updateToolbarSearchTerm(term: string): void {
    this.toolbarSearchTerm.set(term);
    this.showAllNotifications.set(false);
    this.resetTicketsPage();
  }

  updateToolbarSelectedDate(date: Date | null): void {
    this.toolbarSelectedDate.set(date);
    this.showAllNotifications.set(false);
    this.resetTicketsPage();
  }

  updateTableSearchTerm(term: string): void {
    this.tableSearchTerm.set(term);
    this.resetTicketsPage();
  }

  updateDirectorySearchTerm(term: string): void {
    this.directorySearchTerm.set(term);
  }

  toggleNotifications(): void {
    this.showAllNotifications.update((value) => !value);
  }

  toggleTechnicians(): void {
    if (this.transitionPhase() !== 'idle') {
      return;
    }

    const nextValue = !this.showAllTechnicians();

    if (nextValue) {
      this.transitionPhase.set('to-directory');
      setTimeout(() => {
        this.showAllTechnicians.set(true);
        this.transitionPhase.set('idle');
        this.scrollToTechnicianDirectory();
      }, 260);
    } else {
      this.transitionPhase.set('to-dashboard');
      setTimeout(() => {
        this.showAllTechnicians.set(false);
        this.directorySearchTerm.set('');
        this.transitionPhase.set('idle');
      }, 260);
    }
  }

  selectInterventionPeriod(period: DashboardSavInterventionPeriod): void {
    this.selectedInterventionPeriod.set(period);
  }

  exportDashboardData(): void {
    if (this.showAllTechnicians()) {
      const technicians = this.filteredTechnicians();

      if (!technicians.length) {
        return;
      }

      this.downloadCsv('dashboard-sav-techniciens.csv', [
        [
          'ID Technicien',
          'Nom',
          'Spécialité',
          'Note',
          'Tickets en cours',
          'Téléphone',
        ],
        ...technicians.map((technician) => [
          technician.id,
          technician.name,
          technician.specialty,
          technician.rating,
          technician.tickets,
          technician.phone,
        ]),
      ]);

      return;
    }

    this.exportVisibleTickets();
  }

  exportVisibleTickets(): void {
    const tickets = this.visibleTickets();

    if (!tickets.length) {
      return;
    }

    this.downloadCsv('dashboard-sav-tickets.csv', [
      [
        'ID Ticket',
        'Client',
        'Bien',
        'Problème',
        'Priorité',
        'Créé le',
        'Statut',
      ],
      ...tickets.map((ticket) => [
        ticket.id,
        ticket.client,
        ticket.property,
        ticket.issue,
        ticket.priority,
        ticket.createdAtLabel,
        ticket.status,
      ]),
    ]);
  }

  trackByTicketId(_: number, ticket: DashboardSavTicket): string {
    return ticket.id;
  }

  trackByNotificationId(
    _: number,
    notification: DashboardSavNotificationItem,
  ): string {
    return notification.id;
  }

  trackByTechnicianId(_: number, technician: DashboardSavTechnician): string {
    return technician.id;
  }

  ratingStars(rating: number): readonly DashboardSavStarTone[] {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const stars: DashboardSavStarTone[] = [];

    for (let index = 0; index < fullStars; index += 1) {
      stars.push('full');
    }

    if (hasHalfStar) {
      stars.push('half');
    }

    return stars;
  }

  private resetTicketsPage(): void {
    this.ticketsCurrentPage.set(1);
  }

  private scrollToTechnicianDirectory(): void {
    const defaultView = this.document.defaultView;

    if (!defaultView) {
      return;
    }

    defaultView.requestAnimationFrame(() => {
      this.document
        .getElementById('dashboard-sav-technician-directory')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  private downloadCsv(
    fileName: string,
    rows: readonly (readonly (string | number)[])[],
  ): void {
    const defaultView = this.document.defaultView;

    if (!defaultView || typeof Blob === 'undefined') {
      return;
    }

    const csvRows = rows
      .map((row) =>
        row
          .map((cell) => `"${replaceText(String(cell), /"/g, '""')}"`)
          .join(','),
      )
      .join('\n');

    const blob = new Blob([`\uFEFF${csvRows}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = defaultView.URL.createObjectURL(blob);
    const link = this.document.createElement('a');

    link.href = url;
    link.download = fileName;
    this.document.body.append(link);
    link.click();
    link.remove();
    defaultView.URL.revokeObjectURL(url);
  }
}
