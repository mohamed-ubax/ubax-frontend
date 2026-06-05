import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import type { PartnerApplicationResponse } from '@ubax-workspace/shared-api-types';
import {
  EmptyStateComponent,
  KpiCardComponent,
  SectionCardComponent,
} from '@ubax-workspace/shared-design-system';
import {
  NOTIFICATION_HANDLER,
  resolveHttpErrorMessage,
} from '@ubax-workspace/shared-data-access';
import { UbaxPaginatorComponent } from '@ubax-workspace/shared-ui';
import { SelectModule } from 'primeng/select';
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

const STATUS_LABEL_MAP: Record<string, string> = {
  PENDING: 'En attente',
  UNDER_REVIEW: 'En examen',
  INCOMPLETE: 'Incomplet',
  APPROVED: 'Approuvé',
  REJECTED: 'Rejeté',
};

interface CandidatureKpiCard {
  iconClass: string;
  iconToneClass: string;
  label: string;
  value: number;
  trend: string;
  positive: boolean;
  graphWrapClass: string;
  graphClass: string;
  gradientStart: string;
  gradientEnd: string;
}

const PAGE_SIZE = 12;

@Component({
  selector: 'ubax-admin-candidatures-list-page',
  standalone: true,
  imports: [
    FormsModule,
    SelectModule,
    KpiCardComponent,
    SectionCardComponent,
    EmptyStateComponent,
    UbaxPaginatorComponent,
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

  protected readonly pageSize = PAGE_SIZE;
  protected readonly statusFilterOptions = STATUS_FILTER_OPTIONS;

  protected readonly listTitle = computed(() => {
    const status = this.statusFilter();
    if (status === 'PENDING') return 'Candidatures en attente';
    if (status === 'UNDER_REVIEW') return 'Candidatures en examen';
    if (status === 'INCOMPLETE') return 'Candidatures incomplètes';
    if (status === 'APPROVED') return 'Candidatures approuvées';
    if (status === 'REJECTED') return 'Candidatures rejetées';
    return 'Liste des candidatures';
  });

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

  protected readonly filteredCount = computed(
    () => this.filteredApplications().length,
  );

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
      APPROVED: apps.filter((a) => a.status === 'APPROVED').length,
      REJECTED: apps.filter((a) => a.status === 'REJECTED').length,
    };
  });

  protected readonly kpiCards = computed<CandidatureKpiCard[]>(() => {
    const counts = this.statusCounts();

    return [
      {
        label: 'En attente',
        value: counts.PENDING,
        trend: '0 ce mois ci',
        positive: true,
        iconClass: 'pi pi-hourglass',
        iconToneClass:
          'candidatures-kpi__icon candidatures-kpi__icon--orange',
        graphWrapClass:
          'candidatures-kpi__graph-wrap candidatures-kpi__graph-wrap--orange',
        graphClass: 'candidatures-kpi__graph candidatures-kpi__graph--orange',
        gradientStart: '#FCD79A',
        gradientEnd: '#F59E0B',
      },
      {
        label: 'En examen',
        value: counts.UNDER_REVIEW,
        trend: '0 ce mois ci',
        positive: true,
        iconClass: 'pi pi-search',
        iconToneClass: 'candidatures-kpi__icon candidatures-kpi__icon--blue',
        graphWrapClass:
          'candidatures-kpi__graph-wrap candidatures-kpi__graph-wrap--blue',
        graphClass: 'candidatures-kpi__graph candidatures-kpi__graph--blue',
        gradientStart: '#93C5FD',
        gradientEnd: '#3B82F6',
      },
      {
        label: 'Approuvés',
        value: counts.APPROVED,
        trend: '0 ce mois ci',
        positive: true,
        iconClass: 'pi pi-check-circle',
        iconToneClass:
          'candidatures-kpi__icon candidatures-kpi__icon--green',
        graphWrapClass:
          'candidatures-kpi__graph-wrap candidatures-kpi__graph-wrap--green',
        graphClass: 'candidatures-kpi__graph candidatures-kpi__graph--green',
        gradientStart: '#8CE3A5',
        gradientEnd: '#22C55E',
      },
      {
        label: 'Rejetés',
        value: counts.REJECTED,
        trend: '0 ce mois ci',
        positive: false,
        iconClass: 'pi pi-times-circle',
        iconToneClass: 'candidatures-kpi__icon candidatures-kpi__icon--red',
        graphWrapClass:
          'candidatures-kpi__graph-wrap candidatures-kpi__graph-wrap--red',
        graphClass: 'candidatures-kpi__graph candidatures-kpi__graph--red',
        gradientStart: '#FECACA',
        gradientEnd: '#EF4444',
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

  protected onStatusFilterChange(value: StatusFilter): void {
    this.statusFilter.set(value ?? 'all');
    this.currentPage.set(1);
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  protected viewDetail(app: PartnerApplicationResponse): void {
    void this.router.navigate(['/candidatures', app.id]);
  }

  protected getStatusLabel(status: string | undefined): string {
    return STATUS_LABEL_MAP[status ?? ''] ?? status ?? '—';
  }

  protected applicationStatusClass(app: PartnerApplicationResponse): string {
    const s = app.status ?? '';
    if (s === 'APPROVED')
      return 'candidatures-status-pill candidatures-status-pill--approved';
    if (s === 'REJECTED')
      return 'candidatures-status-pill candidatures-status-pill--rejected';
    if (s === 'UNDER_REVIEW')
      return 'candidatures-status-pill candidatures-status-pill--review';
    if (s === 'INCOMPLETE')
      return 'candidatures-status-pill candidatures-status-pill--incomplete';
    return 'candidatures-status-pill candidatures-status-pill--pending';
  }

  protected getPartnerTypeLabel(type: string | undefined): string {
    if (!type) return '—';
    if (type.includes('AGENCE') || type.includes('IMMOB')) return 'Agence';
    if (type.includes('HOTEL')) return 'Hôtel';
    return type;
  }

  protected cardSubLabel(app: PartnerApplicationResponse): string {
    const type = this.getPartnerTypeLabel(app.partnerType);
    const city = app.city ?? '—';
    return `${type} · ${city}`;
  }
}
