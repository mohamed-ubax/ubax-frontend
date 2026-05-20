import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import type { PartnerApplicationResponse } from '@ubax-workspace/shared-api-types';
import {
  EmptyStateComponent,
  KpiCardComponent,
  SearchFilterBarComponent,
  SectionCardComponent,
  StatusBadgeComponent,
  type FilterOption,
} from '@ubax-workspace/shared-design-system';
import {
  NOTIFICATION_HANDLER,
  resolveHttpErrorMessage,
} from '@ubax-workspace/shared-data-access';
import {
  UiDataTableCellDefDirective,
  type UiDataTableColumn,
  UiDataTableComponent,
  UiDataTableEmptyDefDirective,
  UiPaginationComponent,
} from '@ubax-workspace/shared-ui';
import { AdminCandidaturesService } from '../../services/admin-candidatures.service';

type StatusFilter =
  | 'all'
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'INCOMPLETE'
  | 'APPROVED'
  | 'REJECTED';

const STATUS_FILTER_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'En attente', value: 'PENDING' },
  { label: "En cours d'examen", value: 'UNDER_REVIEW' },
  { label: 'Incomplet', value: 'INCOMPLETE' },
  { label: 'Approuvé', value: 'APPROVED' },
  { label: 'Rejeté', value: 'REJECTED' },
];

const STATUS_BADGE_MAP: Record<
  string,
  'pending' | 'active' | 'warning' | 'danger' | 'neutral' | 'info'
> = {
  PENDING: 'pending',
  UNDER_REVIEW: 'info',
  INCOMPLETE: 'warning',
  APPROVED: 'active',
  REJECTED: 'danger',
};

const STATUS_LABEL_MAP: Record<string, string> = {
  PENDING: 'En attente',
  UNDER_REVIEW: 'En examen',
  INCOMPLETE: 'Incomplet',
  APPROVED: 'Approuvé',
  REJECTED: 'Rejeté',
};

interface CandidatureKpiCard {
  iconClass: string;
  label: string;
  value: number;
}

const PAGE_SIZE = 15;

@Component({
  selector: 'ubax-admin-candidatures-list-page',
  standalone: true,
  imports: [
    DatePipe,
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
  templateUrl: './candidatures-list-page.component.html',
  styleUrl: './candidatures-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CandidaturesListPageComponent {
  private readonly svc = inject(AdminCandidaturesService);
  private readonly notif = inject(NOTIFICATION_HANDLER);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly applications = signal<PartnerApplicationResponse[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly currentPage = signal(1);

  protected readonly tableColumns: readonly UiDataTableColumn<PartnerApplicationResponse>[] =
    [
      { key: 'company', header: 'Entreprise', width: '21%' },
      { key: 'type', header: 'Type', width: '9%' },
      { key: 'legalRep', header: 'Représentant légal', width: '16%' },
      { key: 'email', header: 'Email', width: '16%' },
      { key: 'city', header: 'Ville', width: '9%' },
      { key: 'status', header: 'Statut', width: '11%' },
      { key: 'submittedAt', header: 'Date soumission', width: '10%' },
      { key: 'actions', header: 'Actions', width: '8%', align: 'end' },
    ];

  protected readonly searchFilters: {
    label: string;
    options: FilterOption[];
  }[] = [{ label: 'Tous les statuts', options: STATUS_FILTER_OPTIONS }];

  protected readonly filteredApplications = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    return this.applications().filter((a) => {
      const matchesQuery =
        !query ||
        (a.companyName ?? '').toLowerCase().includes(query) ||
        (a.legalRepFirstName ?? '').toLowerCase().includes(query) ||
        (a.legalRepLastName ?? '').toLowerCase().includes(query) ||
        (a.email ?? '').toLowerCase().includes(query) ||
        (a.city ?? '').toLowerCase().includes(query);
      const matchesStatus = status === 'all' || a.status === status;
      return matchesQuery && matchesStatus;
    });
  });

  protected readonly totalPages = computed(() =>
    Math.ceil(this.filteredApplications().length / PAGE_SIZE),
  );

  protected readonly pagedRows = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filteredApplications().slice(start, start + PAGE_SIZE);
  });

  protected readonly statusCounts = computed(() => {
    const apps = this.applications();
    return {
      PENDING: apps.filter((a) => a.status === 'PENDING').length,
      UNDER_REVIEW: apps.filter((a) => a.status === 'UNDER_REVIEW').length,
      INCOMPLETE: apps.filter((a) => a.status === 'INCOMPLETE').length,
      APPROVED: apps.filter((a) => a.status === 'APPROVED').length,
      REJECTED: apps.filter((a) => a.status === 'REJECTED').length,
    };
  });

  protected readonly totalCount = computed(() => this.applications().length);

  protected readonly kpiCards = computed<CandidatureKpiCard[]>(() => {
    const counts = this.statusCounts();

    return [
      {
        label: 'En attente',
        value: counts.PENDING,
        iconClass: 'pi pi-hourglass candidatures-kpi-card__icon--pending',
      },
      {
        label: 'En examen',
        value: counts.UNDER_REVIEW,
        iconClass: 'pi pi-search candidatures-kpi-card__icon--review',
      },
      {
        label: 'Incomplets',
        value: counts.INCOMPLETE,
        iconClass: 'pi pi-file-edit candidatures-kpi-card__icon--incomplete',
      },
      {
        label: 'Approuvés',
        value: counts.APPROVED,
        iconClass: 'pi pi-check-circle candidatures-kpi-card__icon--approved',
      },
      {
        label: 'Rejetés',
        value: counts.REJECTED,
        iconClass: 'pi pi-times-circle candidatures-kpi-card__icon--rejected',
      },
    ];
  });

  constructor() {
    effect(() => {
      void this.loadApplications();
    });
  }

  private async loadApplications(): Promise<void> {
    this.loading.set(true);
    try {
      this.applications.set(await firstValueFrom(this.svc.listApplications()));
    } catch (err) {
      this.notif.error(
        resolveHttpErrorMessage(
          err,
          'Impossible de charger la liste des candidatures.',
        ),
      );
    } finally {
      this.loading.set(false);
    }
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  protected onFilterChange(event: { filter: string; value: unknown }): void {
    this.statusFilter.set((event.value as StatusFilter) ?? 'all');
    this.currentPage.set(1);
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  protected viewDetail(app: PartnerApplicationResponse): void {
    void this.router.navigate(['/candidatures', app.id]);
  }

  protected getStatusBadge(
    status: string | undefined,
  ): 'pending' | 'active' | 'warning' | 'danger' | 'neutral' | 'info' {
    return STATUS_BADGE_MAP[status ?? ''] ?? 'neutral';
  }

  protected getStatusLabel(status: string | undefined): string {
    return STATUS_LABEL_MAP[status ?? ''] ?? status ?? '—';
  }

  protected getPartnerTypeLabel(type: string | undefined): string {
    if (!type) return '—';
    if (type.includes('AGENCE') || type.includes('IMMOB')) return 'Agence';
    if (type.includes('HOTEL')) return 'Hôtel';
    return type;
  }

  protected getPartnerTypeBadge(type: string | undefined): 'info' | 'neutral' {
    if (!type) return 'neutral';
    if (type.includes('AGENCE') || type.includes('IMMOB')) return 'info';
    return 'neutral';
  }

  protected legalRepName(app: PartnerApplicationResponse): string {
    const parts = [app.legalRepFirstName, app.legalRepLastName].filter(Boolean);
    return parts.length ? parts.join(' ') : '—';
  }
}
