import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UbaxPaginatorComponent } from '@ubax-workspace/shared-ui';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import {
  TicketSav as Ticket,
  TicketCategory,
  TicketingStore,
  TicketPriority,
  TicketStatus,
} from '@ubax-workspace/ubax-web-data-access';
import type { KpiCard, SelectOption } from '../../types/tickets-list-page.types';
import {
  CATEGORY_LABELS,
  normalizeText,
  PAGE_SIZE,
  PRIORITY_META,
  STATUS_META,
} from '../../constants/tickets-list-page.constants';

@Component({
  selector: 'ubax-tickets-list-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    DatePickerModule,
    UbaxPaginatorComponent,
  ],
  templateUrl: './tickets-list-page.component.html',
  styleUrl: './tickets-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketsListPageComponent {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  readonly store = inject(TicketingStore);

  readonly searchTerm = signal('');
  readonly filterStatus = signal<TicketStatus | 'all'>('all');
  readonly filterPriority = signal<TicketPriority | 'all'>('all');
  readonly filterCategory = signal<TicketCategory | 'all'>('all');
  readonly filterDate = signal<Date | null>(null);
  readonly currentPage = signal(1);
  private readonly hasLoaded = signal(false);

  readonly statusOptions: SelectOption<TicketStatus | 'all'>[] = [
    { label: 'Tous les statuts', value: 'all' },
    { label: 'Ouvert', value: 'OPEN' },
    { label: 'En analyse', value: 'IN_ANALYSIS' },
    { label: 'Technicien envoyé', value: 'TECHNICIAN_SENT' },
    { label: 'Résolu', value: 'RESOLVED' },
    { label: 'Clôturé', value: 'CLOSED' },
  ];

  readonly priorityOptions = computed<SelectOption<TicketPriority | 'all'>[]>(
    () => [
      { label: 'Toutes priorités', value: 'all' },
      ...this.store.ticketPriorityOptions().map((option) => ({
        label: option.label,
        value: option.value,
      })),
    ],
  );

  readonly categoryOptions = computed<SelectOption<TicketCategory | 'all'>[]>(
    () => [
      { label: 'Toutes catégories', value: 'all' },
      ...this.store.ticketCategoryOptions().map((option) => ({
        label: option.label,
        value: option.value,
      })),
    ],
  );

  readonly viewState = computed(() => {
    if (this.store.loading() && !this.hasLoaded()) return 'loading';
    if (this.store.error()) return 'error';
    if (
      !this.store.loading() &&
      this.store.entities().length === 0 &&
      this.hasLoaded()
    )
      return 'empty';
    return 'success';
  });

  readonly kpiCards = computed<KpiCard[]>(() => {
    const counts = this.ticketCounts();

    return [
      {
        label: 'Tickets ouverts',
        value: counts.open,
        accent: 'var(--ubax-info)',
        bg: 'var(--ubax-blue-soft)',
        icon: 'pi pi-inbox',
      },
      {
        label: 'En cours',
        value: counts.inProgress,
        accent: 'var(--ubax-lilac)',
        bg: 'var(--ubax-lilac-soft)',
        icon: 'pi pi-wrench',
      },
      {
        label: 'Résolus',
        value: counts.resolved,
        accent: 'var(--ubax-success)',
        bg: 'var(--ubax-success-soft)',
        icon: 'pi pi-check-circle',
      },
      {
        label: 'Urgents',
        value: counts.urgent,
        accent: 'var(--ubax-danger)',
        bg: 'var(--ubax-danger-soft)',
        icon: 'pi pi-bolt',
      },
    ];
  });

  readonly ticketCounts = computed(() => {
    const tickets = this.store.entities();

    return {
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === 'OPEN').length,
      inAnalysis: tickets.filter((ticket) => ticket.status === 'IN_ANALYSIS')
        .length,
      technicianSent: tickets.filter(
        (ticket) => ticket.status === 'TECHNICIAN_SENT',
      ).length,
      resolved: tickets.filter((ticket) => ticket.status === 'RESOLVED').length,
      closed: tickets.filter((ticket) => ticket.status === 'CLOSED').length,
      urgent: tickets.filter((ticket) => ticket.priority === 'URGENT').length,
      inProgress: tickets.filter(
        (ticket) =>
          ticket.status === 'IN_ANALYSIS' ||
          ticket.status === 'TECHNICIAN_SENT',
      ).length,
    };
  });

  readonly filteredTickets = computed<Ticket[]>(() => {
    const query = normalizeText(this.searchTerm());
    const status = this.filterStatus();
    const priority = this.filterPriority();
    const category = this.filterCategory();

    return this.store
      .entities()
      .filter((t) => {
        if (status !== 'all' && t.status !== status) return false;
        if (priority !== 'all' && t.priority !== priority) return false;
        if (category !== 'all' && t.category !== category) return false;
        if (query) {
          const text = normalizeText(
            [
              t.id,
              t.title,
              t.description,
              t.category,
              t.status,
              t.priority,
            ].join(' '),
          );
          if (!text.includes(query)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const priorityOrder: Record<string, number> = {
          URGENT: 0,
          HIGH: 1,
          NORMAL: 2,
          LOW: 3,
        };
        const pa = priorityOrder[a.priority ?? 'LOW'] ?? 3;
        const pb = priorityOrder[b.priority ?? 'LOW'] ?? 3;
        if (pa !== pb) return pa - pb;
        return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
      });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredTickets().length / PAGE_SIZE)),
  );

  readonly pagedTickets = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * PAGE_SIZE;
    return this.filteredTickets().slice(start, start + PAGE_SIZE);
  });

  readonly resultsLabel = computed(() => {
    const total = this.filteredTickets().length;
    if (!total) return 'Aucun résultat';
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(start + PAGE_SIZE - 1, total);
    return `${start}–${end} sur ${total} tickets`;
  });

  readonly statusMeta = STATUS_META;
  readonly priorityMeta = PRIORITY_META;
  readonly categoryLabels = CATEGORY_LABELS;

  constructor() {
    if (
      this.store.ticketCategoryOptions().length === 0 &&
      !this.store.categoryCodeListLoading()
    ) {
      this.store.loadTicketCategories();
    }

    if (
      this.store.ticketPriorityOptions().length === 0 &&
      !this.store.priorityCodeListLoading()
    ) {
      this.store.loadTicketPriorities();
    }

    effect(() => {
      this.loadTickets();
    });

    effect(() => {
      if (!this.store.loading() && !this.hasLoaded()) {
        this.hasLoaded.set(true);
      }
    });

    effect(() => {
      this.searchTerm();
      this.filterStatus();
      this.filterPriority();
      this.filterCategory();
      this.currentPage.set(1);
    });
  }

  getStatusMeta(status: string | undefined) {
    return (
      STATUS_META[(status as TicketStatus) ?? 'OPEN'] ?? STATUS_META['OPEN']
    );
  }

  getPriorityMeta(priority: string | undefined) {
    return (
      PRIORITY_META[(priority as TicketPriority) ?? 'NORMAL'] ??
      PRIORITY_META['NORMAL']
    );
  }

  getCategoryLabel(category = 'OTHER'): string {
    return (
      this.store
        .ticketCategoryOptions()
        .find((option) => option.value === category)?.label ??
      CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ??
      'Autre'
    );
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateStr));
  }

  truncate(text: string | undefined, max = 55): string {
    if (!text) return '—';
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  retryLoad(): void {
    this.hasLoaded.set(false);
    this.loadTickets();
  }

  private loadTickets(): void {
    this.store.load?.({});
  }

  goToDetail(ticket: Ticket): void {
    this.router.navigate(['/tickets', ticket.id]);
  }

  goToCreate(): void {
    this.router.navigate(['/tickets/creer']);
  }

  exportCsv(): void {
    const tickets = this.filteredTickets();
    if (!tickets.length) return;
    const win = this.document.defaultView;
    if (!win) return;

    const rows = [
      ['ID', 'Titre', 'Catégorie', 'Priorité', 'Statut', 'Créé le'],
      ...tickets.map((t) => [
        t.id,
        t.title ?? '',
        this.getCategoryLabel(t.category),
        this.getPriorityMeta(t.priority).label,
        this.getStatusMeta(t.status).label,
        this.formatDate(t.createdAt),
      ]),
    ]
      .map((row) =>
        row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','),
      )
      .join('\n');

    const blob = new Blob([`﻿${rows}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = win.URL.createObjectURL(blob);
    const a = this.document.createElement('a');
    a.href = url;
    a.download = 'tickets-sav.csv';
    this.document.body.append(a);
    a.click();
    a.remove();
    win.URL.revokeObjectURL(url);
  }
}
