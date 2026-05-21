import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BailleurApplication,
  BailleurApplicationsStore,
} from '@ubax-workspace/ubax-web-data-access';
import {
  EmptyStateComponent,
  SearchFilterBarComponent,
  SectionCardComponent,
  StatusBadgeComponent,
  type FilterOption,
  type StatusVariant,
} from '@ubax-workspace/shared-design-system';
import {
  deriveViewState,
  type UiDataTableColumn,
  type ViewState,
  UiDataTableCellDefDirective,
  UiDataTableComponent,
  UiDataTableEmptyDefDirective,
  UiPaginationComponent,
} from '@ubax-workspace/shared-ui';

type StatusFilter = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

const PAGE_SIZE = 10;

const STATUS_OPTIONS: FilterOption[] = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'En attente', value: 'PENDING' },
  { label: 'Approuvées', value: 'APPROVED' },
  { label: 'Rejetées', value: 'REJECTED' },
  { label: 'Annulées', value: 'CANCELLED' },
];

@Component({
  selector: 'ubax-bailleur-applications-list-page',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    EmptyStateComponent,
    SearchFilterBarComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    UiDataTableComponent,
    UiDataTableCellDefDirective,
    UiDataTableEmptyDefDirective,
    UiPaginationComponent,
  ],
  providers: [BailleurApplicationsStore],
  templateUrl: './bailleur-applications-list-page.component.html',
  styleUrl: './bailleur-applications-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BailleurApplicationsListPageComponent {
  protected readonly store = inject(BailleurApplicationsStore);
  protected readonly pageSize = PAGE_SIZE;

  protected readonly searchValue = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly currentPage = signal(1);
  private readonly hasLoaded = signal(false);

  protected readonly tableColumns: readonly UiDataTableColumn<BailleurApplication>[] =
    [
      { key: 'owner', header: 'Nom complet', width: '24%' },
      { key: 'email', header: 'Email', width: '20%' },
      { key: 'phone', header: 'Téléphone', width: '17%' },
      { key: 'status', header: 'Statut', width: '12%' },
      { key: 'createdAt', header: 'Date', width: '15%' },
      { key: 'actions', header: 'Actions', width: '12%', align: 'end' },
    ];

  protected readonly searchFilters = [
    { label: 'Tous les statuts', options: STATUS_OPTIONS },
  ];

  protected readonly viewState = computed<ViewState>(() =>
    deriveViewState(
      this.store.loading(),
      this.store.error(),
      this.store.entities().length === 0,
      this.hasLoaded(),
    ),
  );

  protected readonly filteredRows = computed(() => {
    const query = this.searchValue().toLowerCase().trim();
    const status = this.statusFilter();

    return this.store.entities().filter((application) => {
      const matchesQuery =
        !query ||
        [
          application.firstName,
          application.lastName,
          application.email,
          application.phone,
        ]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(query));
      const matchesStatus = status === 'all' || application.status === status;

      return matchesQuery && matchesStatus;
    });
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredRows().length / PAGE_SIZE)),
  );

  protected readonly pagedRows = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filteredRows().slice(start, start + PAGE_SIZE);
  });

  constructor() {
    effect(
      () => {
        this.store.load?.({ page: 0, size: 200, sort: ['createdAt,desc'] });
      },
      { allowSignalWrites: true },
    );

    effect(() => {
      if (!this.store.loading() && !this.hasLoaded()) {
        this.hasLoaded.set(true);
      }
    });

    effect(() => {
      this.searchValue();
      this.statusFilter();
      this.currentPage.set(1);
    });
  }

  protected onSearchChange(value: string): void {
    this.searchValue.set(value);
  }

  protected onFilterChange(event: { filter: string; value: unknown }): void {
    this.statusFilter.set((event.value as StatusFilter) ?? 'all');
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  protected fullName(application: BailleurApplication): string {
    return [application.firstName, application.lastName]
      .filter((value): value is string => Boolean(value))
      .join(' ');
  }

  protected statusLabel(status: BailleurApplication['status']): string {
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
    status: BailleurApplication['status'],
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
