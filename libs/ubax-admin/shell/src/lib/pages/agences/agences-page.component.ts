import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAgenciesStore } from '@ubax-workspace/ubax-admin-data-access';
import type {
  AdminAgencyResponse,
  UpdateSubscriptionRequest,
} from '@ubax-workspace/shared-api-types';
import {
  ConfirmDialogComponent,
  EmptyStateComponent,
  KpiCardComponent,
  SearchFilterBarComponent,
  SectionCardComponent,
  StatusBadgeComponent,
  type FilterOption,
} from '@ubax-workspace/shared-design-system';
import {
  UiDataTableCellDefDirective,
  type UiDataTableColumn,
  UiDataTableComponent,
  UiDataTableEmptyDefDirective,
  UiPaginationComponent,
} from '@ubax-workspace/shared-ui';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access/auth-store';
import { NOTIFICATION_HANDLER } from '@ubax-workspace/shared-data-access';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';

type StatusFilter = 'all' | 'active' | 'suspended';
type VerificationFilter = 'all' | 'verified' | 'unverified';

const STATUS_FILTER_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'Actives', value: 'active' },
  { label: 'Suspendues', value: 'suspended' },
];

const VERIFICATION_FILTER_OPTIONS: {
  label: string;
  value: VerificationFilter;
}[] = [
  { label: 'Toutes les vérifications', value: 'all' },
  { label: 'Vérifiées', value: 'verified' },
  { label: 'Non vérifiées', value: 'unverified' },
];

const DEFAULT_SUBSCRIPTION_PLANS = ['FREE', 'PRO', 'PREMIUM'] as const;
const PAGE_SIZE = 15;

@Component({
  selector: 'ubax-admin-agences-page',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    DatePickerModule,
    DialogModule,
    SelectModule,
    KpiCardComponent,
    SearchFilterBarComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    ConfirmDialogComponent,
    UiDataTableComponent,
    UiDataTableCellDefDirective,
    UiDataTableEmptyDefDirective,
    UiPaginationComponent,
  ],
  templateUrl: './agences-page.component.html',
  styleUrl: './agences-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgencesPageComponent implements OnInit {
  private readonly store = inject(AdminAgenciesStore);
  private readonly authStore = inject(AuthStore);
  private readonly notif = inject(NOTIFICATION_HANDLER);
  private readonly router = inject(Router);

  protected readonly loading = this.store.loading;
  protected readonly actionLoading = signal(false);
  protected readonly agencies = this.store.agencies;
  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly subscriptionFilter = signal<string>('all');
  protected readonly verificationFilter = signal<VerificationFilter>('all');
  protected readonly currentPage = signal(1);

  protected readonly isSuperAdmin = this.authStore.isSuperAdmin;

  protected readonly showConfirm = signal(false);
  protected readonly confirmAction = signal<'activate' | 'suspend' | null>(
    null,
  );
  protected readonly selectedAgency = signal<AdminAgencyResponse | null>(null);
  protected readonly showSubscriptionDialog = signal(false);
  protected readonly subscriptionLoading = signal(false);

  protected subscriptionPlanValue: string | null = null;
  protected subscriptionExpiresAtValue: Date | null = null;
  protected readonly today = new Date();

  protected readonly subscriptionPlanOptions = computed<FilterOption[]>(() => {
    const dynamicPlans = this.agencies()
      .map((agency) => agency.subscriptionPlan?.trim().toUpperCase())
      .filter((plan): plan is string => Boolean(plan));

    const plans = [
      ...new Set([...DEFAULT_SUBSCRIPTION_PLANS, ...dynamicPlans]),
    ];
    return [
      { label: 'Tous les plans', value: 'all' },
      ...plans.map((plan) => ({ label: plan, value: plan })),
    ];
  });

  protected readonly searchFilters = computed<
    {
      label: string;
      options: FilterOption[];
    }[]
  >(() => [
    { label: 'Tous les statuts', options: STATUS_FILTER_OPTIONS },
    { label: 'Tous les plans', options: this.subscriptionPlanOptions() },
    { label: 'Toutes les vérifications', options: VERIFICATION_FILTER_OPTIONS },
  ]);

  protected readonly kpis = computed(() => {
    const agencies = this.agencies();
    const active = agencies.filter((agency) => agency.active).length;
    const suspended = agencies.length - active;
    const subscribed = agencies.filter(
      (agency) => agency.subscriptionActive,
    ).length;
    const verified = agencies.filter((agency) => agency.verified).length;

    return { active, subscribed, suspended, verified };
  });

  protected readonly tableColumns: readonly UiDataTableColumn<AdminAgencyResponse>[] =
    [
      { key: 'agency', header: 'Agence', width: '20%' },
      { key: 'email', header: 'Email', width: '16%' },
      { key: 'phone', header: 'Téléphone', width: '13%' },
      { key: 'city', header: 'Ville', width: '10%' },
      { key: 'verification', header: 'Vérification', width: '11%' },
      { key: 'subscription', header: 'Abonnement', width: '12%' },
      { key: 'status', header: 'Statut', width: '8%' },
      { key: 'actions', header: 'Actions', width: '10%', align: 'end' },
    ];

  protected readonly filteredAgencies = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    const subscription = this.subscriptionFilter();
    const verification = this.verificationFilter();

    return this.agencies().filter((a) => {
      const matchesQuery =
        !query ||
        (a.name ?? '').toLowerCase().includes(query) ||
        (a.city ?? '').toLowerCase().includes(query) ||
        (a.email ?? '').toLowerCase().includes(query);
      const matchesStatus =
        status === 'all' ||
        (status === 'active' && a.active) ||
        (status === 'suspended' && !a.active);
      const matchesSubscription =
        subscription === 'all' ||
        (a.subscriptionPlan ?? '').trim().toUpperCase() === subscription;
      const matchesVerification =
        verification === 'all' ||
        (verification === 'verified' && !!a.verified) ||
        (verification === 'unverified' && !a.verified);

      return (
        matchesQuery &&
        matchesStatus &&
        matchesSubscription &&
        matchesVerification
      );
    });
  });

  protected readonly totalPages = computed(() =>
    Math.ceil(this.filteredAgencies().length / PAGE_SIZE),
  );

  protected readonly pagedRows = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filteredAgencies().slice(start, start + PAGE_SIZE);
  });

  protected readonly agencyCount = computed(() => this.agencies().length);

  ngOnInit(): void {
    void this.loadAgencies();
  }

  private async loadAgencies(): Promise<void> {
    try {
      await this.store.load();
    } catch {
      this.notif.error(
        this.store.error() ?? 'Impossible de charger la liste des agences.',
      );
    }
  }

  protected initials(a: AdminAgencyResponse): string {
    return (a.name ?? 'AG').slice(0, 2).toUpperCase();
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

    if (event.filter === 'Tous les plans') {
      this.subscriptionFilter.set((event.value as string) ?? 'all');
      return;
    }

    this.verificationFilter.set((event.value as VerificationFilter) ?? 'all');
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  protected viewMembers(agency: AdminAgencyResponse): void {
    void this.router.navigate(['/agences', agency.id, 'membres']);
  }

  protected promptToggle(agency: AdminAgencyResponse): void {
    this.selectedAgency.set(agency);
    this.confirmAction.set(agency.active ? 'suspend' : 'activate');
    this.showConfirm.set(true);
  }

  protected openSubscriptionDialog(agency: AdminAgencyResponse): void {
    this.selectedAgency.set(agency);
    this.subscriptionPlanValue =
      agency.subscriptionPlan?.trim().toUpperCase() ?? null;
    this.subscriptionExpiresAtValue = agency.subscriptionExpiresAt
      ? new Date(agency.subscriptionExpiresAt)
      : null;
    this.showSubscriptionDialog.set(true);
  }

  protected closeSubscriptionDialog(): void {
    this.showSubscriptionDialog.set(false);
    this.subscriptionPlanValue = null;
    this.subscriptionExpiresAtValue = null;
  }

  protected async saveSubscription(): Promise<void> {
    const agency = this.selectedAgency();
    if (
      !agency?.id ||
      !this.subscriptionPlanValue ||
      !this.subscriptionExpiresAtValue
    ) {
      this.notif.error("Veuillez renseigner un plan et une date d'expiration.");
      return;
    }

    this.subscriptionLoading.set(true);
    const body: UpdateSubscriptionRequest = {
      subscriptionExpiresAt: this.toIsoDateTime(
        this.subscriptionExpiresAtValue,
      ),
      subscriptionPlan: this.subscriptionPlanValue,
    };

    try {
      await this.store.updateSubscription(agency.id, body);
      this.notif.success("Abonnement de l'agence mis à jour.");
      this.closeSubscriptionDialog();
    } catch {
      this.notif.error(
        this.store.error() ??
          "Impossible de mettre à jour l'abonnement de l'agence.",
      );
    } finally {
      this.subscriptionLoading.set(false);
    }
  }

  protected async confirmToggle(): Promise<void> {
    const agency = this.selectedAgency();
    if (!agency?.id) return;

    this.actionLoading.set(true);
    try {
      const action = this.confirmAction();
      if (action === 'activate') {
        await this.store.activate(agency.id);
      } else {
        await this.store.suspend(agency.id);
      }
      this.notif.success(
        action === 'activate' ? 'Agence activée.' : 'Agence suspendue.',
      );
      this.showConfirm.set(false);
    } catch {
      this.notif.error(this.store.error() ?? "L'opération a échoué.");
    } finally {
      this.actionLoading.set(false);
    }
  }

  protected get confirmTitle(): string {
    return this.confirmAction() === 'activate'
      ? "Activer l'agence"
      : "Suspendre l'agence";
  }

  protected get confirmMessage(): string {
    const name = this.selectedAgency()?.name ?? 'cette agence';
    return this.confirmAction() === 'activate'
      ? `Activer ${name} lui permettra d'accéder à nouveau à la plateforme.`
      : `Suspendre ${name} bloquera l'accès à la plateforme pour cette agence.`;
  }

  protected get confirmLabel(): string {
    return this.confirmAction() === 'activate' ? 'Activer' : 'Suspendre';
  }

  protected get confirmSeverity(): 'success' | 'warn' {
    return this.confirmAction() === 'activate' ? 'success' : 'warn';
  }

  protected get subscriptionSaveDisabled(): boolean {
    return (
      this.subscriptionLoading() ||
      !this.subscriptionPlanValue ||
      !this.subscriptionExpiresAtValue
    );
  }

  protected formatDate(value?: string | null): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  protected subscriptionVariant(
    agency: AdminAgencyResponse,
  ): 'active' | 'warning' | 'neutral' {
    if (!agency.subscriptionActive) {
      return 'neutral';
    }

    if (this.isExpired(agency.subscriptionExpiresAt)) {
      return 'warning';
    }

    return 'active';
  }

  protected subscriptionLabel(agency: AdminAgencyResponse): string {
    return agency.subscriptionPlan?.trim().toUpperCase() ?? 'Inactif';
  }

  private isExpired(value?: string | null): boolean {
    if (!value) {
      return false;
    }

    const expiry = new Date(value);
    if (Number.isNaN(expiry.getTime())) {
      return false;
    }

    return expiry.getTime() < Date.now();
  }

  private toIsoDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00`;
  }
}
