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
  MandatesStore,
  type Mandate,
  type MandateStatus,
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

type StatusFilter = 'all' | MandateStatus;

const PAGE_SIZE = 10;

const STATUS_OPTIONS: FilterOption[] = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'Brouillons', value: 'DRAFT' },
  { label: 'En attente de signature', value: 'PENDING_SIGNATURE' },
  { label: 'Actifs', value: 'ACTIVE' },
  { label: 'Résiliés', value: 'TERMINATED' },
  { label: 'Annulés', value: 'CANCELLED' },
];

@Component({
  selector: 'ubax-mandats-list-page',
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
  providers: [MandatesStore],
  templateUrl: './mandats-list-page.component.html',
  styleUrl: './mandats-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MandatsListPageComponent {
  protected readonly store = inject(MandatesStore);
  protected readonly pageSize = PAGE_SIZE;

  protected readonly searchValue = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly currentPage = signal(1);
  private readonly hasLoaded = signal(false);

  protected readonly tableColumns: readonly UiDataTableColumn<Mandate>[] = [
    { key: 'referenceNumber', header: 'Référence', width: '18%' },
    { key: 'owner', header: 'Bailleur', width: '22%' },
    { key: 'status', header: 'Statut', width: '16%' },
    { key: 'startDate', header: 'Début', width: '12%' },
    { key: 'endDate', header: 'Fin', width: '12%' },
    { key: 'createdAt', header: 'Créé le', width: '10%' },
    { key: 'actions', header: 'Actions', width: '10%', align: 'end' },
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

    return this.store.entities().filter((mandate) => {
      const matchesQuery =
        !query ||
        [
          mandate.referenceNumber,
          mandate.ownerFullName,
          mandate.ownerPhone,
          mandate.agencyName,
        ]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(query));
      const matchesStatus = status === 'all' || mandate.status === status;

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
        this.store.load?.({
          pageable: { page: 0, size: 200, sort: ['createdAt,desc'] },
        });
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

  protected statusLabel(status: Mandate['status']): string {
    switch (status) {
      case 'DRAFT':
        return 'Brouillon';
      case 'PENDING_SIGNATURE':
        return 'En attente de signature';
      case 'ACTIVE':
        return 'Actif';
      case 'TERMINATED':
        return 'Résilié';
      case 'CANCELLED':
        return 'Annulé';
      default:
        return '—';
    }
  }

  protected statusVariant(status: Mandate['status']): StatusVariant {
    switch (status) {
      case 'DRAFT':
        return 'neutral';
      case 'PENDING_SIGNATURE':
        return 'pending';
      case 'ACTIVE':
        return 'active';
      case 'TERMINATED':
        return 'danger';
      case 'CANCELLED':
        return 'neutral';
      default:
        return 'neutral';
    }
  }
}
