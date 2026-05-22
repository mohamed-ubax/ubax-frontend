import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  AdminMandatesStore,
  type AdminMandate,
  type AdminMandateStatus,
} from '@ubax-workspace/ubax-admin-data-access';
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

type StatusFilter = 'all' | AdminMandateStatus;

const PAGE_SIZE = 15;

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'Brouillons', value: 'DRAFT' },
  { label: 'En attente de signature', value: 'PENDING_SIGNATURE' },
  { label: 'Actifs', value: 'ACTIVE' },
  { label: 'Résiliés', value: 'TERMINATED' },
  { label: 'Annulés', value: 'CANCELLED' },
];

@Component({
  selector: 'ubax-admin-mandats-page',
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
  templateUrl: './mandats-page.component.html',
  styleUrl: './mandats-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MandatsPageComponent implements OnInit {
  protected readonly store = inject(AdminMandatesStore);
  private readonly notif = inject(NOTIFICATION_HANDLER);
  protected readonly pageSize = PAGE_SIZE;
  protected readonly loading = this.store.loading;
  protected readonly activatingId = this.store.activatingId;

  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly agencyFilter = signal('all');
  protected readonly currentPage = signal(1);
  protected readonly actionLoading = signal(false);

  protected readonly tableColumns: readonly UiDataTableColumn<AdminMandate>[] =
    [
      { key: 'referenceNumber', header: 'Référence', width: '18%' },
      { key: 'agency', header: 'Agence', width: '21%' },
      { key: 'owner', header: 'Bailleur', width: '18%' },
      { key: 'status', header: 'Statut', width: '16%' },
      { key: 'createdAt', header: 'Créé le', width: '12%' },
      { key: 'actions', header: 'Actions', width: '15%', align: 'end' },
    ];

  protected readonly agencyOptions = computed<FilterOption[]>(() => {
    const agencies = [
      ...new Set(
        this.store
          .mandates()
          .map((mandate) => mandate.agencyName?.trim())
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

  protected readonly filteredMandates = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    const agency = this.agencyFilter();

    return this.store.mandates().filter((mandate) => {
      const matchesQuery =
        !query ||
        [
          mandate.referenceNumber,
          mandate.agencyName,
          mandate.ownerFullName,
          mandate.ownerPhone,
        ]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(query));
      const matchesStatus = status === 'all' || mandate.status === status;
      const matchesAgency = agency === 'all' || mandate.agencyName === agency;

      return matchesQuery && matchesStatus && matchesAgency;
    });
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredMandates().length / PAGE_SIZE)),
  );

  protected readonly pagedRows = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filteredMandates().slice(start, start + PAGE_SIZE);
  });

  protected readonly totalCount = computed(() => this.store.mandates().length);

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      await this.store.load();
    } catch {
      this.notif.error(
        this.store.error() ?? 'Impossible de charger les mandats.',
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

  protected async activateMandate(mandate: AdminMandate): Promise<void> {
    if (!mandate.id) {
      return;
    }

    this.actionLoading.set(true);

    try {
      await this.store.activate(mandate.id);
      this.notif.success('Mandat activé.');
    } catch {
      this.notif.error(this.store.error() ?? "Impossible d'activer le mandat.");
    } finally {
      this.actionLoading.set(false);
    }
  }

  protected statusLabel(status: AdminMandate['status']): string {
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

  protected statusVariant(status: AdminMandate['status']): StatusVariant {
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
