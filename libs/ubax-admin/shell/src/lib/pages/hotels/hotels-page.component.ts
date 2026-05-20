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
import { AdminHotelsStore } from '@ubax-workspace/ubax-admin-data-access';
import type {
  AdminHotelResponse,
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
type StarsFilter = 'all' | '1' | '2' | '3' | '4' | '5';

const STATUS_FILTER_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'Actifs', value: 'active' },
  { label: 'Suspendus', value: 'suspended' },
];

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
  templateUrl: './hotels-page.component.html',
  styleUrl: './hotels-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotelsPageComponent implements OnInit {
  private readonly store = inject(AdminHotelsStore);
  private readonly authStore = inject(AuthStore);
  private readonly notif = inject(NOTIFICATION_HANDLER);
  private readonly router = inject(Router);

  protected readonly loading = this.store.loading;
  protected readonly actionLoading = signal(false);
  protected readonly hotels = this.store.hotels;
  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly subscriptionFilter = signal<string>('all');
  protected readonly starsFilter = signal<StarsFilter>('all');
  protected readonly currentPage = signal(1);

  protected readonly isSuperAdmin = this.authStore.isSuperAdmin;

  protected readonly showConfirm = signal(false);
  protected readonly confirmAction = signal<'activate' | 'suspend' | null>(
    null,
  );
  protected readonly selectedHotel = signal<AdminHotelResponse | null>(null);
  protected readonly showSubscriptionDialog = signal(false);
  protected readonly subscriptionLoading = signal(false);

  protected subscriptionPlanValue: string | null = null;
  protected subscriptionExpiresAtValue: Date | null = null;

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

  protected readonly searchFilters = computed<
    {
      label: string;
      options: FilterOption[];
    }[]
  >(() => [
    { label: 'Tous les statuts', options: STATUS_FILTER_OPTIONS },
    { label: 'Tous les plans', options: this.subscriptionPlanOptions() },
    { label: 'Toutes les étoiles', options: STARS_FILTER_OPTIONS },
  ]);

  protected readonly kpis = computed(() => {
    const hotels = this.hotels();
    const active = hotels.filter((hotel) => hotel.active).length;
    const suspended = hotels.length - active;
    const subscribed = hotels.filter(
      (hotel) => hotel.subscriptionActive,
    ).length;
    const roomCount = hotels.reduce(
      (sum, hotel) => sum + (hotel.totalRooms ?? 0),
      0,
    );

    return { active, roomCount, subscribed, suspended };
  });

  protected readonly tableColumns: readonly UiDataTableColumn<AdminHotelResponse>[] =
    [
      { key: 'hotel', header: 'Hôtel', width: '19%' },
      { key: 'email', header: 'Email', width: '16%' },
      { key: 'phone', header: 'Téléphone', width: '13%' },
      { key: 'city', header: 'Ville', width: '10%' },
      { key: 'stars', header: 'Étoiles', width: '8%' },
      { key: 'rooms', header: 'Chambres', width: '8%', align: 'center' },
      { key: 'subscription', header: 'Abonnement', width: '10%' },
      { key: 'status', header: 'Statut', width: '6%' },
      { key: 'actions', header: 'Actions', width: '10%', align: 'end' },
    ];

  protected readonly filteredHotels = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    const subscription = this.subscriptionFilter();
    const stars = this.starsFilter();

    return this.hotels().filter((h) => {
      const matchesQuery =
        !query ||
        (h.name ?? '').toLowerCase().includes(query) ||
        (h.city ?? '').toLowerCase().includes(query) ||
        (h.email ?? '').toLowerCase().includes(query);
      const matchesStatus =
        status === 'all' ||
        (status === 'active' && h.active) ||
        (status === 'suspended' && !h.active);
      const matchesSubscription =
        subscription === 'all' ||
        (h.subscriptionPlan ?? '').trim().toUpperCase() === subscription;
      const matchesStars = stars === 'all' || String(h.stars ?? '') === stars;

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

  protected readonly hotelCount = computed(() => this.hotels().length);

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

  protected initials(h: AdminHotelResponse): string {
    return (h.name ?? 'HT').slice(0, 2).toUpperCase();
  }

  protected stars(h: AdminHotelResponse): string {
    return h.stars ? '★'.repeat(h.stars) : '—';
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

    this.starsFilter.set((event.value as StarsFilter) ?? 'all');
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
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
