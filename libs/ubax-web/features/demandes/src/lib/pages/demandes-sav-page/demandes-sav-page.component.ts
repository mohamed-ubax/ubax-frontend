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
import type {
  SavSelectOption,
  SavTicketFilterState,
  SavTicketPriorityFilter,
  SavTicketStatusFilter,
} from '../../types/demandes-sav.types';
import {
  SAV_ISSUES,
  SAV_NOTIFICATIONS,
  SAV_TICKETS,
  SHARED_ASSET_ROOT,
  TICKETS_PER_PAGE,
  areTicketFiltersEqual,
  createDefaultTicketFilters,
  isSameCalendarDay,
  normalizeText,
} from '../../constants/demandes-sav.constants';

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
      (issue) => ({ label: issue, value: issue }),
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

  readonly statCards = computed(() => {
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
      ['ID Ticket', 'Client', 'Bien', 'Problème', 'Priorité', 'Créé le', 'Statut'],
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
