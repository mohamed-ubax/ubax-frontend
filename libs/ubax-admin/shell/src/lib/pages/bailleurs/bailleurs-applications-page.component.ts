import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { AdminBailleurApplicationsStore } from '@ubax-workspace/ubax-admin-data-access';
import type { BailleurApplicationResponse } from '@ubax-workspace/shared-api-types';
import {
  EmptyStateComponent,
  SearchFilterBarComponent,
  SectionCardComponent,
  StatusBadgeComponent,
  type FilterOption,
  type StatusVariant,
} from '@ubax-workspace/shared-design-system';
import { NOTIFICATION_HANDLER } from '@ubax-workspace/shared-data-access';
import {
  UiDataTableCellDefDirective,
  type UiDataTableColumn,
  UiDataTableComponent,
  UiDataTableEmptyDefDirective,
  UiPaginationComponent,
} from '@ubax-workspace/shared-ui';

type StatusFilter = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

const PAGE_SIZE = 15;

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'En attente', value: 'PENDING' },
  { label: 'Approuvées', value: 'APPROVED' },
  { label: 'Rejetées', value: 'REJECTED' },
  { label: 'Annulées', value: 'CANCELLED' },
];

@Component({
  selector: 'ubax-admin-bailleurs-applications-page',
  standalone: true,
  imports: [
    DatePipe,
    EmptyStateComponent,
    SearchFilterBarComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    UiDataTableComponent,
    UiDataTableCellDefDirective,
    UiDataTableEmptyDefDirective,
    UiPaginationComponent,
  ],
  templateUrl: './bailleurs-applications-page.component.html',
  styleUrl: './bailleurs-applications-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BailleursApplicationsPageComponent implements OnInit {
  protected readonly store = inject(AdminBailleurApplicationsStore);
  private readonly notif = inject(NOTIFICATION_HANDLER);
  protected readonly pageSize = PAGE_SIZE;

  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly agencyFilter = signal('all');
  protected readonly currentPage = signal(1);

  protected readonly tableColumns: readonly UiDataTableColumn<BailleurApplicationResponse>[] =
    [
      { key: 'owner', header: 'Bailleur', width: '24%' },
      { key: 'agency', header: 'Agence', width: '22%' },
      { key: 'email', header: 'Email', width: '19%' },
      { key: 'phone', header: 'Téléphone', width: '14%' },
      { key: 'status', header: 'Statut', width: '11%' },
      { key: 'createdAt', header: 'Créée le', width: '10%' },
    ];

  protected readonly agencyOptions = computed<FilterOption[]>(() => {
    const agencies = [
      ...new Set(
        this.store
          .applications()
          .map((application) => application.agencyName?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ].sort((left, right) => left.localeCompare(right, 'fr'));

    return [
      { label: 'Toutes les agences', value: 'all' },
      ...agencies.map((agency) => ({ label: agency, value: agency })),
    ];
  });

  protected readonly searchFilters = computed<
    {
      label: string;
      options: FilterOption[];
    }[]
  >(() => [
    { label: 'Tous les statuts', options: STATUS_OPTIONS },
    { label: 'Toutes les agences', options: this.agencyOptions() },
  ]);

  protected readonly filteredApplications = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    const agency = this.agencyFilter();

    return this.store.applications().filter((application) => {
      const matchesQuery =
        !query ||
        [
          application.firstName,
          application.lastName,
          application.email,
          application.phone,
          application.agencyName,
        ]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(query));
      const matchesStatus = status === 'all' || application.status === status;
      const matchesAgency =
        agency === 'all' || application.agencyName === agency;

      return matchesQuery && matchesStatus && matchesAgency;
    });
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredApplications().length / PAGE_SIZE)),
  );

  protected readonly pagedRows = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filteredApplications().slice(start, start + PAGE_SIZE);
  });

  protected readonly totalCount = computed(
    () => this.store.applications().length,
  );

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      await this.store.load();
    } catch {
      this.notif.error(
        this.store.error() ?? 'Impossible de charger les demandes bailleur.',
      );
    }
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  protected onFilterChange(event: { filter: string; value: unknown }): void {
    this.currentPage.set(1);

    if (event.filter === 'Tous les statuts') {
      this.statusFilter.set((event.value as StatusFilter) ?? 'all');
      return;
    }

    this.agencyFilter.set((event.value as string) ?? 'all');
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  protected fullName(application: BailleurApplicationResponse): string {
    return [application.firstName, application.lastName]
      .filter((value): value is string => Boolean(value))
      .join(' ');
  }

  protected statusLabel(status: BailleurApplicationResponse['status']): string {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'APPROVED':
        return 'Approuvée';
      case 'REJECTED':
        return 'Rejetée';
      case 'CANCELLED':
        return 'Annulée';
      default:
        return '—';
    }
  }

  protected statusVariant(
    status: BailleurApplicationResponse['status'],
  ): StatusVariant {
    switch (status) {
      case 'PENDING':
        return 'pending';
      case 'APPROVED':
        return 'active';
      case 'REJECTED':
        return 'danger';
      case 'CANCELLED':
        return 'neutral';
      default:
        return 'neutral';
    }
  }
}
