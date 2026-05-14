import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { ContratsStore, ContractStatus } from '@ubax-workspace/ubax-web-data-access';
import {
  StatusBadgeComponent,
  type StatusVariant,
} from '@ubax-workspace/shared-design-system';
import { UbaxPaginatorComponent, deriveViewState, type ViewState } from '@ubax-workspace/shared-ui';
import { ContratsSkeletonComponent } from '../../components/contrats-skeleton/contrats-skeleton.component';

const PAGE_SIZE = 10;

const STATUS_LABELS: Record<ContractStatus, string> = {
  DRAFT: 'Brouillon',
  PENDING_SIGNATURE: 'En attente de signature',
  ACTIVE: 'Actif',
  TERMINATED: 'Résilié',
  EXPIRED: 'Expiré',
  CANCELLED: 'Annulé',
};

const STATUS_VARIANTS: Record<ContractStatus, StatusVariant> = {
  DRAFT: 'neutral',
  PENDING_SIGNATURE: 'pending',
  ACTIVE: 'active',
  TERMINATED: 'cancelled',
  EXPIRED: 'cancelled',
  CANCELLED: 'cancelled',
};

@Component({
  selector: 'ubax-contrats-list-page',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    Select,
    StatusBadgeComponent,
    UbaxPaginatorComponent,
    ContratsSkeletonComponent,
  ],
  templateUrl: './contrats-list-page.component.html',
  styleUrl: './contrats-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratsListPageComponent {
  protected readonly store = inject(ContratsStore);

  readonly searchValue = signal('');
  readonly activeTab = signal<ContractStatus | 'all'>('all');
  readonly currentPage = signal(1);
  private readonly hasLoaded = signal(false);

  readonly viewState = computed<ViewState>(() =>
    deriveViewState(
      this.store.loading(),
      this.store.error(),
      this.store.isEmpty(),
      this.hasLoaded(),
    ),
  );

  readonly statusOptions = [
    { label: 'Tous les statuts', value: 'all' },
    { label: 'Brouillons', value: 'DRAFT' },
    { label: 'En attente', value: 'PENDING_SIGNATURE' },
    { label: 'Actifs', value: 'ACTIVE' },
    { label: 'Résiliés / Annulés', value: 'TERMINATED' },
  ];

  readonly kpiCards = computed(() => [
    {
      label: 'Total contrats',
      value: this.store.entities().length,
      icon: 'pi pi-file',
      accent: 'var(--ubax-info)',
      bg: 'var(--ubax-blue-soft)',
    },
    {
      label: 'Actifs',
      value: this.store.contratsActifs().length,
      icon: 'pi pi-check-circle',
      accent: 'var(--ubax-success)',
      bg: 'var(--ubax-success-soft)',
    },
    {
      label: 'En attente',
      value: this.store.contratsEnAttente().length,
      icon: 'pi pi-clock',
      accent: '#f97316',
      bg: '#fff7ed',
    },
    {
      label: 'Résiliés / Annulés',
      value: this.store.contratsTermines().length,
      icon: 'pi pi-times-circle',
      accent: 'var(--ubax-danger)',
      bg: '#fef2f2',
    },
  ]);

  readonly filteredRows = computed(() => {
    const search = this.searchValue().toLowerCase().trim();
    const tab = this.activeTab();

    return this.store
      .entities()
      .filter((c) => {
        if (tab === 'all') return true;
        if (tab === 'TERMINATED') return c.status === 'TERMINATED' || c.status === 'CANCELLED';
        return c.status === tab;
      })
      .filter((c) => {
        if (!search) return true;
        const tenant = (c.tenantName ?? '').toLowerCase();
        const address = (c.propertyAddress ?? '').toLowerCase();
        return tenant.includes(search) || address.includes(search);
      })
      .sort((a, b) => {
        if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
        if (b.status === 'ACTIVE' && a.status !== 'ACTIVE') return 1;
        return (b.startDate ?? '').localeCompare(a.startDate ?? '');
      });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredRows().length / PAGE_SIZE)),
  );

  readonly pagedRows = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filteredRows().slice(start, start + PAGE_SIZE);
  });

  readonly resultsLabel = computed(() => {
    const count = this.filteredRows().length;
    return `${count} contrat${count > 1 ? 's' : ''}`;
  });

  constructor() {
    effect(() => {
      this.store.load!({ pageable: { page: 0, size: 100, sort: [] } });
    }, { allowSignalWrites: true });

    effect(() => {
      if (!this.store.loading() && !this.hasLoaded()) {
        this.hasLoaded.set(true);
      }
    });

    effect(() => {
      this.searchValue();
      this.activeTab();
      this.currentPage.set(1);
    });
  }

  onSearch(value: string): void { this.searchValue.set(value); }
  onTabChange(tab: string): void { this.activeTab.set(tab as ContractStatus | 'all'); }
  retryLoad(): void { this.hasLoaded.set(false); this.store.load!({ pageable: { page: 0, size: 100, sort: [] } }); }

  getStatusLabel(status: ContractStatus | undefined): string {
    return status ? STATUS_LABELS[status] : '—';
  }

  getStatusVariant(status: ContractStatus | undefined): StatusVariant {
    return status ? STATUS_VARIANTS[status] : 'neutral';
  }

  formatAmount(amount: number | undefined): string {
    if (!amount) return '—';
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return 'Indéterminée';
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
