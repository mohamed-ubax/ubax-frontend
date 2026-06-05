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
import { AdminHotelsStore } from '@ubax-workspace/ubax-admin-data-access';
import type {
  AdminHotelResponse,
  UpdateSubscriptionRequest,
} from '@ubax-workspace/shared-api-types';
import {
  ConfirmDialogComponent,
  EmptyStateComponent,
  KpiCardComponent,
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
  UbaxPaginatorComponent,
} from '@ubax-workspace/shared-ui';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access/auth-store';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';

type StatusFilter = 'all' | 'active' | 'pending' | 'suspended';
type StarsFilter = 'all' | '1' | '2' | '3' | '4' | '5';
type TableHotelStatus = 'active' | 'pending' | 'suspended';

const DEFAULT_SUBSCRIPTION_PLANS = ['FREE', 'PRO', 'PREMIUM'] as const;
const PAGE_SIZE = 15;
const STARS_FILTER_OPTIONS: { label: string; value: StarsFilter }[] = [
  { label: 'Toutes les étoiles', value: 'all' },
  { label: '1 étoile', value: '1' },
  { label: '2 étoiles', value: '2' },
  { label: '3 étoiles', value: '3' },
  { label: '4 étoiles', value: '4' },
  { label: '5 étoiles', value: '5' },
];

@Component({
  selector: 'ubax-admin-hotels-page',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    DatePickerModule,
    DialogModule,
    SelectModule,
    KpiCardComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    ConfirmDialogComponent,
    UiDataTableComponent,
    UiDataTableCellDefDirective,
    UiDataTableEmptyDefDirective,
    UbaxPaginatorComponent,
  ],
  templateUrl: './hotels-page.component.html',
  styleUrl: './hotels-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotelsPageComponent implements OnInit {
  private readonly store = inject(AdminHotelsStore);
  private readonly authStore = inject(AuthStore);
  private readonly notif = inject(NOTIFICATION_HANDLER);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly loading = this.store.loading;
  protected readonly actionLoading = signal(false);
  protected readonly hotels = this.store.hotels;
  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly subscriptionFilter = signal<string>('all');
  protected readonly starsFilter = signal<StarsFilter>('all');
  protected readonly currentPage = signal(1);

  protected readonly isSuperAdmin = this.authStore.isSuperAdmin;
  protected readonly pageSize = PAGE_SIZE;

  protected readonly showConfirm = signal(false);
  protected readonly confirmAction = signal<'activate' | 'suspend' | null>(
    null,
  );
  protected readonly selectedHotel = signal<AdminHotelResponse | null>(null);
  protected readonly showSubscriptionDialog = signal(false);
  protected readonly subscriptionLoading = signal(false);
  protected readonly openedActionHotelId = signal<string | null>(null);
  protected readonly actionPopoverTop = signal(0);
  protected readonly actionPopoverLeft = signal(0);

  protected subscriptionPlanValue: string | null = null;
  protected subscriptionExpiresAtValue: Date | null = null;
  protected readonly today = new Date();

  protected readonly pageTitle = computed(() => {
    const status = this.statusFilter();

    if (status === 'active') {
      return 'Hôtels actifs';
    }

    if (status === 'pending') {
      return 'Hôtels en attente';
    }

    if (status === 'suspended') {
      return 'Hôtels suspendus';
    }

    return 'Tous les hôtels';
  });

  protected readonly listTitle = computed(() => {
    const status = this.statusFilter();

    if (status === 'active') {
      return 'Liste des hôtels actifs';
    }

    if (status === 'pending') {
      return 'Liste des hôtels en attente';
    }

    if (status === 'suspended') {
      return 'Liste des hôtels suspendus';
    }

    return 'Liste des hôtels';
  });

  protected readonly hasKpiSection = computed(
    () => this.statusFilter() === 'all',
  );

  protected readonly subscriptionPlanOptions = computed<FilterOption[]>(() => {
    const dynamicPlans = this.hotels()
      .map((hotel) => hotel.subscriptionPlan?.trim().toUpperCase())
      .filter((plan): plan is string => Boolean(plan));

    const plans = [
      ...new Set([...DEFAULT_SUBSCRIPTION_PLANS, ...dynamicPlans]),
    ];

    return [
      { label: 'Tous les plans', value: 'all' },
      ...plans.map((plan) => ({ label: plan, value: plan })),
    ];
  });

  protected readonly starsFilterOptions = STARS_FILTER_OPTIONS;

  protected readonly kpis = computed(() => {
    const hotels = this.hotels();
    const active = hotels.filter(
      (hotel) => this.resolveHotelStatus(hotel) === 'active',
    ).length;
    const pending = hotels.filter(
      (hotel) => this.resolveHotelStatus(hotel) === 'pending',
    ).length;
    const suspended = hotels.filter(
      (hotel) => this.resolveHotelStatus(hotel) === 'suspended',
    ).length;

    return {
      total: hotels.length,
      active,
      pending,
      suspended,
    };
  });

  protected readonly kpiCards = computed(() => {
    const kpis = this.kpis();

    return [
      {
        label: 'Tous les hôtels',
        value: kpis.total,
        trend: this.kpiTrendText(kpis.total, 'up'),
        positive: true,
        iconClass: 'pi pi-building',
        iconToneClass: 'hotels-kpi__icon--purple',
        graphWrapClass: 'hotels-kpi__graph-wrap hotels-kpi__graph-wrap--purple',
        graphClass: 'hotels-kpi__graph hotels-kpi__graph--purple',
        gradientStart: '#E8B6F7',
        gradientEnd: '#BE4FE7',
      },
      {
        label: 'Hôtels actifs',
        value: kpis.active,
        trend: this.kpiTrendText(kpis.active, 'up'),
        positive: true,
        iconClass: 'pi pi-check-circle',
        iconToneClass: 'hotels-kpi__icon--green',
        graphWrapClass: 'hotels-kpi__graph-wrap hotels-kpi__graph-wrap--green',
        graphClass: 'hotels-kpi__graph hotels-kpi__graph--green',
        gradientStart: '#8CE3A5',
        gradientEnd: '#22C55E',
      },
      {
        label: 'En attente',
        value: kpis.pending,
        trend: this.kpiTrendText(kpis.pending, 'up'),
        positive: true,
        iconClass: 'pi pi-clock',
        iconToneClass: 'hotels-kpi__icon--orange',
        graphWrapClass: 'hotels-kpi__graph-wrap hotels-kpi__graph-wrap--orange',
        graphClass: 'hotels-kpi__graph hotels-kpi__graph--orange',
        gradientStart: '#FCD79A',
        gradientEnd: '#F59E0B',
      },
      {
        label: 'Suspendus',
        value: kpis.suspended,
        trend: this.kpiTrendText(kpis.suspended, 'down'),
        positive: false,
        iconClass: 'pi pi-ban',
        iconToneClass: 'hotels-kpi__icon--red',
        graphWrapClass: 'hotels-kpi__graph-wrap hotels-kpi__graph-wrap--red',
        graphClass: 'hotels-kpi__graph hotels-kpi__graph--red',
        gradientStart: '#FECACA',
        gradientEnd: '#EF4444',
      },
    ] as const;
  });

  protected readonly tableColumns: readonly UiDataTableColumn<AdminHotelResponse>[] =
    [
      { key: 'hotel', header: 'Hôtels', width: '34%' },
      { key: 'location', header: 'Localisation', width: '18%' },
      { key: 'stars', header: 'Catégorie', width: '14%' },
      { key: 'rooms', header: 'Chambres', width: '12%', align: 'center' },
      { key: 'status', header: 'Statut', width: '12%', align: 'center' },
      { key: 'actions', header: 'Actions', width: '10%', align: 'center' },
    ];

  protected readonly filteredHotels = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    const subscription = this.subscriptionFilter();
    const stars = this.starsFilter();

    return this.hotels().filter((hotel) => {
      const resolvedStatus = this.resolveHotelStatus(hotel);

      const matchesQuery =
        !query ||
        (hotel.name ?? '').toLowerCase().includes(query) ||
        (hotel.city ?? '').toLowerCase().includes(query) ||
        (hotel.email ?? '').toLowerCase().includes(query);

      const matchesStatus =
        status === 'all' ||
        (status === 'active' && resolvedStatus === 'active') ||
        (status === 'pending' && resolvedStatus === 'pending') ||
        (status === 'suspended' && resolvedStatus === 'suspended');

      const matchesSubscription =
        subscription === 'all' ||
        (hotel.subscriptionPlan ?? '').trim().toUpperCase() === subscription;

      const matchesStars =
        stars === 'all' || String(hotel.stars ?? '') === stars;

      return (
        matchesQuery && matchesStatus && matchesSubscription && matchesStars
      );
    });
  });

  protected readonly totalPages = computed(() =>
    Math.ceil(this.filteredHotels().length / PAGE_SIZE),
  );

  protected readonly pagedRows = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filteredHotels().slice(start, start + PAGE_SIZE);
  });

  protected readonly hotelCount = computed(() => this.filteredHotels().length);

  protected readonly syncStatusFromQuery = effect(
    () => {
      const status = this.queryParamMap().get('status');
      this.statusFilter.set(this.normalizeStatusFilter(status));
      this.currentPage.set(1);
    },
    { allowSignalWrites: true },
  );

  ngOnInit(): void {
    void this.loadHotels();
  }

  private async loadHotels(): Promise<void> {
    try {
      await this.store.load();
    } catch {
      this.notif.error(
        this.store.error() ?? 'Impossible de charger la liste des hôtels.',
      );
    }
  }

  protected initials(hotel: AdminHotelResponse): string {
    return (hotel.name ?? 'HT').slice(0, 2).toUpperCase();
  }

  protected stars(hotel: AdminHotelResponse): string {
    return hotel.stars ? '★'.repeat(hotel.stars) : '—';
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  protected onStarsFilterChange(value: StarsFilter): void {
    this.starsFilter.set(value);
    this.currentPage.set(1);
  }

  protected onSubscriptionFilterChange(value: string): void {
    this.subscriptionFilter.set(value);
    this.currentPage.set(1);
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  protected toggleActionsPopover(
    event: MouseEvent,
    hotel: AdminHotelResponse,
  ): void {
    event.stopPropagation();

    const id = hotel.id ?? null;
    if (!id) {
      this.openedActionHotelId.set(null);
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

    this.selectedHotel.set(hotel);
    this.actionPopoverTop.set(rect.bottom + 8);
    this.actionPopoverLeft.set(nextLeft);
    this.openedActionHotelId.set(this.openedActionHotelId() === id ? null : id);
  }

  protected isActionsPopoverOpen(hotel: AdminHotelResponse): boolean {
    return Boolean(hotel.id) && this.openedActionHotelId() === hotel.id;
  }

  protected closeActionsPopover(): void {
    this.openedActionHotelId.set(null);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('.hotels-actions-popover')) {
      return;
    }

    this.closeActionsPopover();
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  protected onViewportChange(): void {
    this.closeActionsPopover();
  }

  protected handleViewMembers(hotel: AdminHotelResponse): void {
    this.closeActionsPopover();
    this.viewMembers(hotel);
  }

  protected handleOpenSubscription(hotel: AdminHotelResponse): void {
    this.closeActionsPopover();
    this.openSubscriptionDialog(hotel);
  }

  protected handlePromptToggle(hotel: AdminHotelResponse): void {
    this.closeActionsPopover();
    this.promptToggle(hotel);
  }

  protected viewDetails(hotel: AdminHotelResponse): void {
    if (!hotel.id) {
      return;
    }

    void this.router.navigate(['/hotels', hotel.id]);
  }

  protected viewMembers(hotel: AdminHotelResponse): void {
    void this.router.navigate(['/hotels', hotel.id, 'membres']);
  }

  protected promptToggle(hotel: AdminHotelResponse): void {
    this.selectedHotel.set(hotel);
    this.confirmAction.set(hotel.active ? 'suspend' : 'activate');
    this.showConfirm.set(true);
  }

  protected openSubscriptionDialog(hotel: AdminHotelResponse): void {
    this.selectedHotel.set(hotel);
    this.subscriptionPlanValue =
      hotel.subscriptionPlan?.trim().toUpperCase() ?? null;
    this.subscriptionExpiresAtValue = hotel.subscriptionExpiresAt
      ? new Date(hotel.subscriptionExpiresAt)
      : null;
    this.showSubscriptionDialog.set(true);
  }

  protected closeSubscriptionDialog(): void {
    this.showSubscriptionDialog.set(false);
    this.subscriptionPlanValue = null;
    this.subscriptionExpiresAtValue = null;
  }

  protected async saveSubscription(): Promise<void> {
    const hotel = this.selectedHotel();
    if (
      !hotel?.id ||
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
      await this.store.updateSubscription(hotel.id, body);
      this.notif.success("Abonnement de l'hôtel mis à jour.");
      this.closeSubscriptionDialog();
    } catch {
      this.notif.error(
        this.store.error() ??
          "Impossible de mettre à jour l'abonnement de l'hôtel.",
      );
    } finally {
      this.subscriptionLoading.set(false);
    }
  }

  protected async confirmToggle(): Promise<void> {
    const hotel = this.selectedHotel();
    if (!hotel?.id) return;

    this.actionLoading.set(true);
    try {
      const action = this.confirmAction();
      if (action === 'activate') {
        await this.store.activate(hotel.id);
      } else {
        await this.store.suspend(hotel.id);
      }
      this.notif.success(
        action === 'activate' ? 'Hôtel activé.' : 'Hôtel suspendu.',
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
      ? "Activer l'hôtel"
      : "Suspendre l'hôtel";
  }

  protected get confirmMessage(): string {
    const name = this.selectedHotel()?.name ?? 'cet hôtel';
    return this.confirmAction() === 'activate'
      ? `Activer ${name} lui permettra d'accéder à nouveau à la plateforme.`
      : `Suspendre ${name} bloquera l'accès à la plateforme pour cet hôtel.`;
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

  protected hotelStatusLabel(hotel: AdminHotelResponse): string {
    const status = this.resolveHotelStatus(hotel);

    if (status === 'active') {
      return 'Actif';
    }

    if (status === 'pending') {
      return 'En attente';
    }

    return 'Suspendu';
  }

  protected hotelStatusCssClass(hotel: AdminHotelResponse): string {
    const status = this.resolveHotelStatus(hotel);

    if (status === 'active') {
      return 'hotels-status-pill hotels-status-pill--active';
    }

    if (status === 'pending') {
      return 'hotels-status-pill hotels-status-pill--pending';
    }

    return 'hotels-status-pill hotels-status-pill--suspended';
  }

  protected hotelStatusVariant(
    hotel: AdminHotelResponse,
  ): 'active' | 'warning' | 'suspended' {
    const status = this.resolveHotelStatus(hotel);

    if (status === 'active') {
      return 'active';
    }

    if (status === 'pending') {
      return 'warning';
    }

    return 'suspended';
  }

  protected subscriptionVariant(
    hotel: AdminHotelResponse,
  ): 'active' | 'warning' | 'neutral' {
    if (!hotel.subscriptionActive) {
      return 'neutral';
    }

    if (this.isExpired(hotel.subscriptionExpiresAt)) {
      return 'warning';
    }

    return 'active';
  }

  protected subscriptionLabel(hotel: AdminHotelResponse): string {
    return hotel.subscriptionPlan?.trim().toUpperCase() ?? 'Inactif';
  }

  protected hotelCode(hotel: AdminHotelResponse): string {
    const base = (hotel.id ?? '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 5);
    return base ? `UBX-HT${base.toUpperCase()}` : 'UBX-HT001';
  }

  protected locationLabel(hotel: AdminHotelResponse): string {
    return hotel.city ?? '—';
  }

  private normalizeStatusFilter(value: string | null): StatusFilter {
    if (value === 'active' || value === 'pending' || value === 'suspended') {
      return value;
    }

    return 'all';
  }

  private resolveHotelStatus(hotel: AdminHotelResponse): TableHotelStatus {
    if (!hotel.active) {
      return 'suspended';
    }

    if (
      !hotel.subscriptionActive ||
      this.isExpired(hotel.subscriptionExpiresAt)
    ) {
      return 'pending';
    }

    return 'active';
  }

  private kpiTrendText(value: number, direction: 'up' | 'down'): string {
    const delta = Math.max(1, Math.round(value * 0.08));
    return direction === 'up'
      ? `+ ${delta} ce mois ci`
      : `-${delta} ce mois ci`;
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
