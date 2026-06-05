import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminAgenciesStore } from '@ubax-workspace/ubax-admin-data-access';
import type {
  AdminAgencyResponse,
  UpdateSubscriptionRequest,
} from '@ubax-workspace/shared-api-types';
import {
  ConfirmDialogComponent,
  EmptyStateComponent,
  KpiCardComponent,
  SectionCardComponent,
  StatusBadgeComponent,
} from '@ubax-workspace/shared-design-system';
import { UbaxPaginatorComponent } from '@ubax-workspace/shared-ui';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access/auth-store';
import { NOTIFICATION_HANDLER } from '@ubax-workspace/shared-data-access';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';

type StatusFilter = 'all' | 'active' | 'pending' | 'suspended';

const PAGE_SIZE = 12;

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
    SectionCardComponent,
    EmptyStateComponent,
    ConfirmDialogComponent,
    StatusBadgeComponent,
    UbaxPaginatorComponent,
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
  private readonly route = inject(ActivatedRoute);

  private readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly loading = this.store.loading;
  protected readonly agencies = this.store.agencies;
  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly currentPage = signal(1);

  protected readonly isSuperAdmin = this.authStore.isSuperAdmin;
  protected readonly pageSize = PAGE_SIZE;
  protected readonly actionLoading = signal(false);
  protected readonly showConfirm = signal(false);
  protected readonly confirmAction = signal<'activate' | 'suspend' | null>(
    null,
  );
  protected readonly selectedAgency = signal<AdminAgencyResponse | null>(null);
  protected readonly showSubscriptionDialog = signal(false);
  protected readonly subscriptionLoading = signal(false);
  protected readonly openedActionAgencyId = signal<string | null>(null);
  protected readonly actionPopoverTop = signal(0);
  protected readonly actionPopoverLeft = signal(0);

  protected subscriptionPlanValue: string | null = null;
  protected subscriptionExpiresAtValue: Date | null = null;
  protected readonly today = new Date();

  protected readonly pageTitle = computed(() => {
    const status = this.statusFilter();

    if (status === 'active') {
      return 'Agences actives';
    }

    if (status === 'pending') {
      return 'Agences en attente';
    }

    if (status === 'suspended') {
      return 'Agences suspendues';
    }

    return 'Toutes les agences';
  });

  protected readonly listTitle = computed(() => {
    const status = this.statusFilter();

    if (status === 'active') {
      return 'Liste des agences actives';
    }

    if (status === 'pending') {
      return 'Liste des agences en attente';
    }

    if (status === 'suspended') {
      return 'Liste des agences suspendues';
    }

    return 'Liste des agences';
  });

  protected readonly hasKpiSection = computed(
    () => this.statusFilter() === 'all',
  );

  protected readonly kpis = computed(() => {
    const agencies = this.agencies();
    const active = agencies.filter(
      (agency) => this.resolveAgencyStatus(agency) === 'active',
    ).length;
    const pending = agencies.filter(
      (agency) => this.resolveAgencyStatus(agency) === 'pending',
    ).length;
    const suspended = agencies.filter(
      (agency) => this.resolveAgencyStatus(agency) === 'suspended',
    ).length;

    return {
      total: agencies.length,
      active,
      pending,
      suspended,
    };
  });

  protected readonly kpiCards = computed(() => {
    const kpis = this.kpis();

    return [
      {
        label: 'Toutes les agences',
        value: kpis.total,
        trend: '+ 12 ce mois ci',
        positive: true,
        iconClass: 'pi pi-home',
        iconToneClass: 'agencies-kpi__icon agencies-kpi__icon--purple',
        graphWrapClass:
          'agencies-kpi__graph-wrap agencies-kpi__graph-wrap--purple',
        graphClass: 'agencies-kpi__graph agencies-kpi__graph--purple',
        gradientStart: '#E8B6F7',
        gradientEnd: '#BE4FE7',
      },
      {
        label: 'Agences actives',
        value: kpis.active,
        trend: '+ 45 ce mois ci',
        positive: true,
        iconClass: 'pi pi-check',
        iconToneClass: 'agencies-kpi__icon agencies-kpi__icon--green',
        graphWrapClass:
          'agencies-kpi__graph-wrap agencies-kpi__graph-wrap--green',
        graphClass: 'agencies-kpi__graph agencies-kpi__graph--green',
        gradientStart: '#8CE3A5',
        gradientEnd: '#22C55E',
      },
      {
        label: 'En attente',
        value: kpis.pending,
        trend: '+ 3 ce mois ci',
        positive: true,
        iconClass: 'pi pi-clock',
        iconToneClass: 'agencies-kpi__icon agencies-kpi__icon--orange',
        graphWrapClass:
          'agencies-kpi__graph-wrap agencies-kpi__graph-wrap--orange',
        graphClass: 'agencies-kpi__graph agencies-kpi__graph--orange',
        gradientStart: '#FCD79A',
        gradientEnd: '#F59E0B',
      },
      {
        label: 'Suspendus',
        value: kpis.suspended,
        trend: '-2 ce mois ci',
        positive: false,
        iconClass: 'pi pi-ban',
        iconToneClass: 'agencies-kpi__icon agencies-kpi__icon--red',
        graphWrapClass:
          'agencies-kpi__graph-wrap agencies-kpi__graph-wrap--red',
        graphClass: 'agencies-kpi__graph agencies-kpi__graph--red',
        gradientStart: '#FECACA',
        gradientEnd: '#EF4444',
      },
    ] as const;
  });

  protected readonly syncStatusFromQuery = effect(
    () => {
      const status = this.queryParamMap().get('status');
      this.statusFilter.set(this.normalizeStatusFilter(status));
      this.currentPage.set(1);
    },
    { allowSignalWrites: true },
  );

  protected readonly filteredAgencies = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();

    return this.agencies().filter((a) => {
      const resolvedStatus = this.resolveAgencyStatus(a);
      const matchesQuery =
        !query ||
        (a.name ?? '').toLowerCase().includes(query) ||
        (a.city ?? '').toLowerCase().includes(query) ||
        (a.email ?? '').toLowerCase().includes(query);
      const matchesStatus =
        status === 'all' ||
        (status === 'active' && resolvedStatus === 'active') ||
        (status === 'pending' && resolvedStatus === 'pending') ||
        (status === 'suspended' && resolvedStatus === 'suspended');

      return matchesQuery && matchesStatus;
    });
  });

  protected readonly totalPages = computed(() =>
    Math.ceil(this.filteredAgencies().length / PAGE_SIZE),
  );

  protected readonly pagedRows = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filteredAgencies().slice(start, start + PAGE_SIZE);
  });

  protected readonly agencyCount = computed(
    () => this.filteredAgencies().length,
  );

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

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  protected toggleActionsPopover(
    event: MouseEvent,
    agency: AdminAgencyResponse,
  ): void {
    event.stopPropagation();

    const id = agency.id ?? null;
    if (!id) {
      this.openedActionAgencyId.set(null);
      return;
    }

    const trigger = event.currentTarget as HTMLElement | null;
    if (!trigger) {
      this.closeActionsPopover();
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const panelWidth = 286;
    const margin = 12;
    const nextLeft = Math.max(
      margin,
      Math.min(
        window.innerWidth - panelWidth - margin,
        rect.right - panelWidth,
      ),
    );

    this.selectedAgency.set(agency);
    this.actionPopoverTop.set(rect.bottom + 8);
    this.actionPopoverLeft.set(nextLeft);
    this.openedActionAgencyId.set(
      this.openedActionAgencyId() === id ? null : id,
    );
  }

  protected isActionsPopoverOpen(agency: AdminAgencyResponse): boolean {
    return Boolean(agency.id) && this.openedActionAgencyId() === agency.id;
  }

  protected closeActionsPopover(): void {
    this.openedActionAgencyId.set(null);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('.agencies-actions-popover')) {
      return;
    }

    this.closeActionsPopover();
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  protected onViewportChange(): void {
    this.closeActionsPopover();
  }

  protected handleViewMembers(agency: AdminAgencyResponse): void {
    this.closeActionsPopover();
    this.viewMembers(agency);
  }

  protected handleOpenSubscription(agency: AdminAgencyResponse): void {
    this.closeActionsPopover();
    this.openSubscriptionDialog(agency);
  }

  protected handlePromptToggle(agency: AdminAgencyResponse): void {
    this.closeActionsPopover();
    this.promptToggle(agency);
  }

  protected viewDetails(agency: AdminAgencyResponse): void {
    if (!agency.id) {
      return;
    }

    void this.router.navigate(['/agences', agency.id]);
  }

  protected viewMembers(agency: AdminAgencyResponse): void {
    if (!agency.id) {
      return;
    }

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
    if (!agency?.id) {
      return;
    }

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

  protected agencyStatusLabel(agency: AdminAgencyResponse): string {
    const status = this.resolveAgencyStatus(agency);

    if (status === 'active') {
      return 'Actif';
    }

    if (status === 'pending') {
      return 'En attente';
    }

    return 'Suspendu';
  }

  protected agencyStatusClass(agency: AdminAgencyResponse): string {
    const status = this.resolveAgencyStatus(agency);

    if (status === 'active') {
      return 'agencies-status-pill agencies-status-pill--active';
    }

    if (status === 'pending') {
      return 'agencies-status-pill agencies-status-pill--pending';
    }

    return 'agencies-status-pill agencies-status-pill--suspended';
  }

  protected agencyCode(agency: AdminAgencyResponse): string {
    const base = (agency.id ?? '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 5);
    return base ? `UBX-AG${base.toUpperCase()}` : 'UBX-AG001';
  }

  protected locationLabel(agency: AdminAgencyResponse): string {
    return agency.city ?? '—';
  }

  private normalizeStatusFilter(value: string | null): StatusFilter {
    if (value === 'active' || value === 'pending' || value === 'suspended') {
      return value;
    }

    return 'all';
  }

  private resolveAgencyStatus(
    agency: AdminAgencyResponse,
  ): 'active' | 'pending' | 'suspended' {
    if (!agency.active) {
      return 'suspended';
    }

    if (
      !agency.subscriptionActive ||
      this.isExpired(agency.subscriptionExpiresAt)
    ) {
      return 'pending';
    }

    return 'active';
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
