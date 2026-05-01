import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UbaxPaginatorComponent } from '@ubax-workspace/shared-ui';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';

type SavPriorityTone = 'urgent' | 'normal';
type SavStatusTone = 'open' | 'progress' | 'success';
type SavTicketStatusFilter = 'all' | SavStatusTone;
type SavTicketPriorityFilter = 'all' | SavPriorityTone;

interface SavSummaryMetric {
  readonly label: string;
  readonly value: number;
  readonly accent: string;
  readonly background: string;
  readonly icon: string;
}

interface SavIssueCard {
  readonly id: string;
  readonly title: string;
  readonly client: string;
  readonly location: string;
  readonly phone: string;
  readonly image: string;
  readonly createdAt: Date;
}

interface SavSelectOption<TValue> {
  readonly label: string;
  readonly value: TValue;
}

interface SavTicketFilterState {
  readonly status: SavTicketStatusFilter;
  readonly priority: SavTicketPriorityFilter;
  readonly issue: string;
  readonly createdAt: Date | null;
}

interface SavTicketRow {
  readonly id: string;
  readonly client: string;
  readonly avatar: string;
  readonly property: string;
  readonly issue: string;
  readonly issueKey: string;
  readonly priority: string;
  readonly priorityTone: SavPriorityTone;
  readonly createdAt: string;
  readonly createdAtDate: Date;
  readonly status: string;
  readonly statusTone: SavStatusTone;
}

interface SavNotificationItem {
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly time: string;
  readonly createdAt: Date;
}

const SHARED_ASSET_ROOT = '/shared/demandes';
const SAV_ASSET_ROOT = '/demandes/sav';
const TICKETS_PER_PAGE = 8;

const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const STATUS_LABELS: Record<SavStatusTone, string> = {
  open: 'Ouvert',
  progress: 'en cours',
  success: 'Résolu',
};

function createDefaultTicketFilters(): SavTicketFilterState {
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
  left: SavTicketFilterState,
  right: SavTicketFilterState,
): boolean {
  return (
    left.status === right.status &&
    left.priority === right.priority &&
    left.issue === right.issue &&
    areFilterDatesEqual(left.createdAt, right.createdAt)
  );
}

const CLIENTS = [
  {
    name: 'Konan Olivier',
    avatar: `${SHARED_ASSET_ROOT}/ticket-avatar-01.webp`,
  },
  {
    name: 'Awa Bakayoko',
    avatar: `${SHARED_ASSET_ROOT}/ticket-avatar-02.webp`,
  },
  {
    name: 'Moussa Traoré',
    avatar: `${SHARED_ASSET_ROOT}/ticket-avatar-03.webp`,
  },
  {
    name: 'Mariam Coulibaly',
    avatar: `${SHARED_ASSET_ROOT}/ticket-avatar-04.webp`,
  },
  {
    name: 'Laura Koné',
    avatar: `${SHARED_ASSET_ROOT}/ticket-avatar-02.webp`,
  },
  {
    name: 'Armand Tano',
    avatar: `${SHARED_ASSET_ROOT}/ticket-avatar-03.webp`,
  },
] as const;

const PROPERTIES = [
  'Résidence Plateau - App 12',
  'Immeuble Kalia - Bureau 04',
  'Riviera Palmeraie - Villa 08',
  'Résidence Cocody - App 21',
] as const;

const ISSUE_TYPES = [
  'Fuite d’eau',
  'Problème électrique',
  'Porte cassée',
  'Climatisation défaillante',
  'Panne ascenseur',
  'Serrure bloquée',
] as const;

function createMockDate(day: number): Date {
  return new Date(2026, 2, day, 9, 0, 0, 0);
}

function formatMockDate(date: Date): string {
  return DATE_FORMATTER.format(date);
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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

function buildTicket(
  sequence: number,
  statusTone: SavStatusTone,
  priorityTone: SavPriorityTone,
  issue: string,
  client: (typeof CLIENTS)[number],
  property: string,
  day: number,
): SavTicketRow {
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
    createdAt: formatMockDate(createdAtDate),
    createdAtDate,
    status: STATUS_LABELS[statusTone],
    statusTone,
  };
}

const BASE_TICKETS: readonly SavTicketRow[] = [
  buildTicket(
    12,
    'success',
    'urgent',
    'Fuite d’eau',
    CLIENTS[0],
    PROPERTIES[0],
    5,
  ),
  buildTicket(
    13,
    'success',
    'urgent',
    'Problème électrique',
    CLIENTS[1],
    PROPERTIES[0],
    5,
  ),
  buildTicket(
    14,
    'progress',
    'normal',
    'Fuite d’eau',
    CLIENTS[2],
    PROPERTIES[0],
    5,
  ),
  buildTicket(
    15,
    'success',
    'urgent',
    'Porte cassée',
    CLIENTS[3],
    PROPERTIES[0],
    5,
  ),
  buildTicket(
    16,
    'success',
    'urgent',
    'Problème électrique',
    CLIENTS[1],
    PROPERTIES[0],
    5,
  ),
  buildTicket(
    17,
    'progress',
    'normal',
    'Fuite d’eau',
    CLIENTS[2],
    PROPERTIES[0],
    5,
  ),
  buildTicket(
    18,
    'success',
    'urgent',
    'Fuite d’eau',
    CLIENTS[0],
    PROPERTIES[0],
    5,
  ),
  buildTicket(
    19,
    'success',
    'urgent',
    'Porte cassée',
    CLIENTS[3],
    PROPERTIES[0],
    5,
  ),
];

const OPEN_TICKETS: readonly SavTicketRow[] = Array.from(
  { length: 22 },
  (_, index) =>
    buildTicket(
      20 + index,
      'open',
      index % 2 === 0 ? 'urgent' : 'normal',
      ISSUE_TYPES[index % ISSUE_TYPES.length],
      CLIENTS[index % CLIENTS.length],
      PROPERTIES[(index + 1) % PROPERTIES.length],
      1 + (index % 10),
    ),
);

const PROGRESS_TICKETS: readonly SavTicketRow[] = Array.from(
  { length: 3 },
  (_, index) =>
    buildTicket(
      42 + index,
      'progress',
      index === 1 ? 'normal' : 'urgent',
      ISSUE_TYPES[(index + 2) % ISSUE_TYPES.length],
      CLIENTS[(index + 2) % CLIENTS.length],
      PROPERTIES[(index + 2) % PROPERTIES.length],
      6 + index,
    ),
);

const SUCCESS_TICKETS: readonly SavTicketRow[] = Array.from(
  { length: 9 },
  (_, index) =>
    buildTicket(
      45 + index,
      'success',
      index % 3 === 0 ? 'normal' : 'urgent',
      ISSUE_TYPES[(index + 3) % ISSUE_TYPES.length],
      CLIENTS[(index + 3) % CLIENTS.length],
      PROPERTIES[index % PROPERTIES.length],
      2 + (index % 8),
    ),
);

const SAV_TICKETS: readonly SavTicketRow[] = [
  ...BASE_TICKETS,
  ...OPEN_TICKETS,
  ...PROGRESS_TICKETS,
  ...SUCCESS_TICKETS,
];

const SAV_ISSUES: readonly SavIssueCard[] = [
  {
    id: 'issue-01',
    title: 'Problème de nom sur le contrat',
    client: 'Mariam Coulibaly',
    location: 'Résidence Plateau - App 12',
    phone: '+225 07 58 23 41 89',
    image: `${SAV_ASSET_ROOT}/issue-property-01.webp`,
    createdAt: createMockDate(5),
  },
  {
    id: 'issue-02',
    title: 'Litige sur la durée du bail',
    client: 'Mariam Coulibaly',
    location: 'Résidence Plateau - App 12',
    phone: '+225 07 58 23 41 89',
    image: `${SAV_ASSET_ROOT}/issue-property-02.webp`,
    createdAt: createMockDate(6),
  },
  {
    id: 'issue-03',
    title: 'Résiliation anticipée',
    client: 'Mariam Coulibaly',
    location: 'Résidence Plateau - App 12',
    phone: '+225 07 58 23 41 89',
    image: `${SAV_ASSET_ROOT}/issue-property-03.webp`,
    createdAt: createMockDate(7),
  },
  {
    id: 'issue-04',
    title: 'Renouvellement de contrat',
    client: 'Mariam Coulibaly',
    location: 'Résidence Plateau - App 12',
    phone: '+225 07 58 23 41 89',
    image: `${SAV_ASSET_ROOT}/issue-property-04.webp`,
    createdAt: createMockDate(8),
  },
];

const SAV_NOTIFICATIONS: readonly SavNotificationItem[] = [
  {
    id: 'notification-01',
    title: 'Technicien assigné',
    message: 'Une nouvelle demande a été enregistrée pour le bien UBX-0845.',
    time: 'il y a 2 minutes',
    createdAt: createMockDate(5),
  },
  {
    id: 'notification-02',
    title: 'Intervention planifiée',
    message:
      'Laura Koné a demandé plus d’informations sur Appartement Riviera Palmeraie',
    time: 'il y a 12 minutes',
    createdAt: createMockDate(6),
  },
  {
    id: 'notification-03',
    title: 'Nouveau ticket SAV créé',
    message: 'Une nouvelle demande a été enregistrée pour le bien UBX-0845.',
    time: 'il y a 16 minutes',
    createdAt: createMockDate(7),
  },
  {
    id: 'notification-04',
    title: 'Nouveau ticket SAV créé',
    message: 'Une nouvelle demande a été enregistrée pour le bien UBX-0845.',
    time: 'il y a 16 minutes',
    createdAt: createMockDate(8),
  },
];

@Component({
  selector: 'ubax-demandes-sav-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePickerModule,
    SelectModule,
    UbaxPaginatorComponent,
  ],
  templateUrl: './demandes-sav-page.component.html',
  styleUrl: './demandes-sav-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemandesSavPageComponent {
  private readonly document = inject(DOCUMENT);

  readonly sharedIcons = {
    search: `${SHARED_ASSET_ROOT}/filter-search.webp`,
    date: `${SHARED_ASSET_ROOT}/filter-date.webp`,
    export: `${SHARED_ASSET_ROOT}/filter-export.webp`,
    chevron: `${SHARED_ASSET_ROOT}/select-chevron.webp`,
    notification: `${SHARED_ASSET_ROOT}/notification-bell.webp`,
  };

  readonly toolbarSearchTerm = signal('');
  readonly toolbarSelectedDate = signal<Date | null>(null);
  readonly tableSearchTerm = signal('');
  readonly ticketsCurrentPage = signal(1);

  readonly draftStatus = signal<SavTicketStatusFilter>('all');
  readonly draftPriority = signal<SavTicketPriorityFilter>('all');
  readonly draftIssue = signal<string>('all');
  readonly draftCreatedAt = signal<Date | null>(null);

  readonly appliedFilters = signal<SavTicketFilterState>(
    createDefaultTicketFilters(),
  );

  readonly draftTicketFilters = computed<SavTicketFilterState>(() => ({
    status: this.draftStatus(),
    priority: this.draftPriority(),
    issue: this.draftIssue(),
    createdAt: this.cloneDate(this.draftCreatedAt()),
  }));

  readonly showResetTicketFiltersButton = computed(() => {
    const hasAppliedFilters = !areTicketFiltersEqual(
      this.appliedFilters(),
      createDefaultTicketFilters(),
    );
    const hasPendingDraftChanges = !areTicketFiltersEqual(
      this.draftTicketFilters(),
      this.appliedFilters(),
    );

    return hasAppliedFilters && !hasPendingDraftChanges;
  });

  readonly statusOptions: SavSelectOption<SavTicketStatusFilter>[] = [
    { label: 'Statut', value: 'all' },
    { label: 'Tickets ouverts', value: 'open' },
    { label: 'Traitement en cours', value: 'progress' },
    { label: 'Tickets résolus', value: 'success' },
  ];

  readonly priorityOptions: SavSelectOption<SavTicketPriorityFilter>[] = [
    { label: 'Priorité', value: 'all' },
    { label: 'Urgent', value: 'urgent' },
    { label: 'Normal', value: 'normal' },
  ];

  readonly issueOptions: SavSelectOption<string>[] = [
    { label: 'Type de problème', value: 'all' },
    ...Array.from(new Set(SAV_TICKETS.map((ticket) => ticket.issueKey))).map(
      (issue) => ({
        label: issue,
        value: issue,
      }),
    ),
  ];

  readonly scopedTickets = computed(() => {
    const query = normalizeText(this.toolbarSearchTerm());
    const selectedDate = this.toolbarSelectedDate();
    const filters = this.appliedFilters();

    return SAV_TICKETS.filter((ticket) => {
      if (query) {
        const searchableText = normalizeText(
          [
            ticket.id,
            ticket.client,
            ticket.property,
            ticket.issue,
            ticket.status,
            ticket.priority,
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
          ticket.status,
          ticket.priority,
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

  readonly statCards = computed<readonly SavSummaryMetric[]>(() => {
    const tickets = this.scopedTickets();

    return [
      {
        label: 'Tickets ouverts',
        value: tickets.filter((ticket) => ticket.statusTone === 'open').length,
        accent: 'var(--ubax-info)',
        background: '#8CCBFF',
        icon: `${SHARED_ASSET_ROOT}/summary-open.webp`,
      },
      {
        label: 'Traitement en cours',
        value: tickets.filter((ticket) => ticket.statusTone === 'progress')
          .length,
        accent: 'var(--ubax-accent)',
        background: '#FBBD86',
        icon: `${SHARED_ASSET_ROOT}/summary-progress.webp`,
      },
      {
        label: 'Tickets résolus',
        value: tickets.filter((ticket) => ticket.statusTone === 'success')
          .length,
        accent: 'var(--ubax-success)',
        background: '#8CFFBE',
        icon: `${SHARED_ASSET_ROOT}/summary-done.webp`,
      },
    ];
  });

  readonly visibleIssueCards = computed(() => {
    const query = normalizeText(this.toolbarSearchTerm());
    const selectedDate = this.toolbarSelectedDate();

    return SAV_ISSUES.filter((issue) => {
      if (query) {
        const searchableText = normalizeText(
          [issue.title, issue.client, issue.location, issue.phone].join(' '),
        );

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return !selectedDate || isSameCalendarDay(issue.createdAt, selectedDate);
    });
  });

  readonly visibleNotifications = computed(() => {
    const query = normalizeText(this.toolbarSearchTerm());
    const selectedDate = this.toolbarSelectedDate();

    return SAV_NOTIFICATIONS.filter((item) => {
      if (query) {
        const searchableText = normalizeText(
          [item.title, item.message, item.time].join(' '),
        );

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return !selectedDate || isSameCalendarDay(item.createdAt, selectedDate);
    });
  });

  applyTicketFilters(): void {
    this.appliedFilters.set({
      status: this.draftStatus(),
      priority: this.draftPriority(),
      issue: this.draftIssue(),
      createdAt: this.cloneDate(this.draftCreatedAt()),
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
    this.resetTicketsPage();
  }

  updateToolbarSearchTerm(term: string): void {
    this.toolbarSearchTerm.set(term);
    this.resetTicketsPage();
  }

  updateToolbarSelectedDate(date: Date | null): void {
    this.toolbarSelectedDate.set(date);
    this.resetTicketsPage();
  }

  updateTableSearchTerm(term: string): void {
    this.tableSearchTerm.set(term);
    this.resetTicketsPage();
  }

  exportVisibleTickets(): void {
    const tickets = this.visibleTickets();
    const defaultView = this.document.defaultView;

    if (!tickets.length || !defaultView || typeof Blob === 'undefined') {
      return;
    }

    const csvRows = [
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
        ticket.createdAt,
        ticket.status,
      ]),
    ]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
      )
      .join('\n');

    const blob = new Blob([`\uFEFF${csvRows}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = defaultView.URL.createObjectURL(blob);
    const link = this.document.createElement('a');

    link.href = url;
    link.download = 'demandes-sav-tickets.csv';
    this.document.body.append(link);
    link.click();
    link.remove();
    defaultView.URL.revokeObjectURL(url);
  }

  private cloneDate(date: Date | null): Date | null {
    return date ? new Date(date) : null;
  }

  private resetTicketsPage(): void {
    this.ticketsCurrentPage.set(1);
  }
}
