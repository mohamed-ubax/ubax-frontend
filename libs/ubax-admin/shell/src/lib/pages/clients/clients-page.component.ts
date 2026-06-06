import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { AdminClientsStore } from '@ubax-workspace/ubax-admin-data-access';
import type { ClientUserResponse } from '@ubax-workspace/shared-api-types';
import {
  EmptyStateComponent,
  KpiCardComponent,
  SearchFilterBarComponent,
  SectionCardComponent,
  StatusBadgeComponent,
  type FilterOption,
} from '@ubax-workspace/shared-design-system';
import { NOTIFICATION_HANDLER } from '@ubax-workspace/shared-data-access';
import {
  UiDataTableCellDefDirective,
  type UiDataTableColumn,
  UiDataTableComponent,
  UiDataTableEmptyDefDirective,
  UiPaginationComponent,
} from '@ubax-workspace/shared-ui';

type StatusFilter = 'all' | 'active' | 'inactive';
type VerificationFilter = 'all' | 'verified' | 'unverified';

const STATUS_FILTER_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'Actifs', value: 'active' },
  { label: 'Inactifs', value: 'inactive' },
];

const VERIFICATION_FILTER_OPTIONS: {
  label: string;
  value: VerificationFilter;
}[] = [
  { label: 'Tous', value: 'all' },
  { label: 'Vérifiés', value: 'verified' },
  { label: 'Non vérifiés', value: 'unverified' },
];
const PAGE_SIZE = 15;

function normalizeText(v: string): string {
  return v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function initials(c: ClientUserResponse): string {
  const f = c.firstName?.[0]?.toUpperCase() ?? '';
  const l = c.lastName?.[0]?.toUpperCase() ?? '';
  return f + l || '?';
}

@Component({
  selector: 'ubax-admin-clients-page',
  standalone: true,
  imports: [
    KpiCardComponent,
    SearchFilterBarComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    UiDataTableComponent,
    UiDataTableCellDefDirective,
    UiDataTableEmptyDefDirective,
    UiPaginationComponent,
  ],
  templateUrl: './clients-page.component.html',
  styleUrl: './clients-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsPageComponent implements OnInit {
  private readonly store = inject(AdminClientsStore);
  private readonly notif = inject(NOTIFICATION_HANDLER);

  protected readonly loading = this.store.loading;
  protected readonly clients = this.store.clients;
  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly emailVerifiedFilter = signal<VerificationFilter>('all');
  protected readonly identityVerifiedFilter = signal<VerificationFilter>('all');
  protected readonly currentPage = signal(1);

  protected readonly tableColumns: readonly UiDataTableColumn<ClientUserResponse>[] =
    [
      { key: 'client', header: 'Client', width: '25%' },
      { key: 'email', header: 'Email', width: '17%' },
      { key: 'phone', header: 'Téléphone', width: '12%' },
      { key: 'city', header: 'Ville', width: '11%' },
      { key: 'verifications', header: 'Vérifications', width: '13%' },
      { key: 'status', header: 'Statut', width: '10%' },
      { key: 'lastLogin', header: 'Dernière connexion', width: '12%' },
    ];

  protected readonly searchFilters = computed<
    {
      label: string;
      options: FilterOption[];
    }[]
  >(() => [
    { label: 'Tous les statuts', options: STATUS_FILTER_OPTIONS },
    { label: 'Email vérifié', options: VERIFICATION_FILTER_OPTIONS },
    { label: 'Identité vérifiée', options: VERIFICATION_FILTER_OPTIONS },
  ]);

  protected readonly kpis = computed(() => {
    const clients = this.clients();
    return {
      active: clients.filter((client) => client.active).length,
      emailVerified: clients.filter((client) => client.emailVerified).length,
      identityVerified: clients.filter((client) => client.identityVerified)
        .length,
    };
  });

  protected readonly filteredClients = computed(() => {
    const query = normalizeText(this.searchQuery());

    return this.clients().filter((c) => {
      if (query) {
        const text = normalizeText(
          [c.firstName, c.lastName, c.email, c.phone, c.city]
            .filter(Boolean)
            .join(' '),
        );
        if (!text.includes(query)) return false;
      }
      return true;
    });
  });

  protected readonly totalPages = computed(() =>
    Math.ceil(this.filteredClients().length / PAGE_SIZE),
  );

  protected readonly pagedRows = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filteredClients().slice(start, start + PAGE_SIZE);
  });

  ngOnInit(): void {
    void this.loadClients();
  }

  private async loadClients(): Promise<void> {
    try {
      await this.store.load({
        active:
          this.statusFilter() === 'all'
            ? undefined
            : this.statusFilter() === 'active',
        emailVerified:
          this.emailVerifiedFilter() === 'all'
            ? undefined
            : this.emailVerifiedFilter() === 'verified',
        identityVerified:
          this.identityVerifiedFilter() === 'all'
            ? undefined
            : this.identityVerifiedFilter() === 'verified',
      });
    } catch {
      this.notif.error(
        this.store.error() ?? 'Impossible de charger la liste des clients.',
      );
    }
  }

  protected getInitials(c: ClientUserResponse): string {
    return initials(c);
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  protected onFilterChange(event: { filter: string; value: unknown }): void {
    this.currentPage.set(1);

    if (event.filter === 'Tous les statuts') {
      this.statusFilter.set((event.value as StatusFilter) ?? 'all');
    } else if (event.filter === 'Email vérifié') {
      this.emailVerifiedFilter.set(
        (event.value as VerificationFilter) ?? 'all',
      );
    } else {
      this.identityVerifiedFilter.set(
        (event.value as VerificationFilter) ?? 'all',
      );
    }

    void this.loadClients();
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  protected formatLastLogin(dateStr?: string): string {
    if (!dateStr) return 'Jamais';
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem.`;
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  }
}
