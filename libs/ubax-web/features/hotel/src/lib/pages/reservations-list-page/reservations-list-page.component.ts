import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConfirmDialogComponent } from '@ubax-workspace/shared-design-system';
import { UbaxPaginatorComponent } from '@ubax-workspace/shared-ui';
import {
  HOTEL_RESERVATION_STATUSES,
  HotelReservation,
  HotelReservationStatus,
  HotelReservationsStore,
} from '@ubax-workspace/ubax-web-data-access';

const PAGE_SIZE = 20;

type ReservationFilter = HotelReservationStatus | 'ALL';
type ReservationAction = 'confirm' | 'complete' | 'noShow';

const STATUS_LABELS: Record<HotelReservationStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  CANCELLED: 'Annulée',
  COMPLETED: 'Séjour terminé',
  NO_SHOW: 'No-show',
};

@Component({
  selector: 'ubax-hotel-reservations-list-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    UbaxPaginatorComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './reservations-list-page.component.html',
  styleUrl: './reservations-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationsListPageComponent {
  protected readonly store = inject(HotelReservationsStore);
  private readonly router = inject(Router);

  protected readonly searchTerm = signal('');
  protected readonly currentPage = signal(1);
  protected readonly selectedFilter = signal<ReservationFilter>('ALL');
  protected readonly confirmAction = signal<ReservationAction | null>(null);
  protected readonly actionTarget = signal<HotelReservation | null>(null);
  protected readonly showConfirmDialog = signal(false);
  protected readonly showCancelDialog = signal(false);
  protected readonly cancelReason = signal('');
  protected readonly pendingRefresh = signal(false);

  protected readonly statusTabs = computed(() => {
    const counts = this.store.reservationCounts();
    const total = HOTEL_RESERVATION_STATUSES.reduce(
      (sum, status) => sum + counts[status],
      0,
    );

    return [
      { label: 'Toutes', value: 'ALL' as const, count: total },
      ...HOTEL_RESERVATION_STATUSES.map((status) => ({
        label: STATUS_LABELS[status],
        value: status,
        count: counts[status],
      })),
    ];
  });

  protected readonly filteredReservations = computed(() => {
    const query = this.normalizeText(this.searchTerm());

    return this.store.filteredReservations().filter((reservation) => {
      if (!query) {
        return true;
      }

      const haystack = this.normalizeText(
        [
          reservation.propertyTitle,
          reservation.propertyCity,
          reservation.clientFullName,
          reservation.clientEmail,
          reservation.status,
        ]
          .filter(Boolean)
          .join(' '),
      );

      return haystack.includes(query);
    });
  });

  protected readonly viewState = computed(() => {
    if (this.store.loading() && this.store.entities().length === 0) {
      return 'loading';
    }

    if (this.store.error() && this.store.entities().length === 0) {
      return 'error';
    }

    if (!this.store.loading() && this.filteredReservations().length === 0) {
      return 'empty';
    }

    return 'success';
  });

  protected readonly resultsLabel = computed(() => {
    const visibleCount = this.filteredReservations().length;
    const total = this.store.totalElements();

    if (visibleCount === 0) {
      return 'Aucune réservation sur cette page';
    }

    return `${visibleCount} réservation${visibleCount > 1 ? 's' : ''} affichée${visibleCount > 1 ? 's' : ''} · ${total} au total`;
  });

  protected readonly confirmDialogTitle = computed(() => {
    switch (this.confirmAction()) {
      case 'confirm':
        return 'Confirmer la réservation';
      case 'complete':
        return 'Terminer le séjour';
      case 'noShow':
        return 'Déclarer un no-show';
      default:
        return 'Confirmer';
    }
  });

  protected readonly confirmDialogMessage = computed(() => {
    const reservation = this.actionTarget();

    if (!reservation) {
      return 'Confirmez cette action.';
    }

    const customer = reservation.clientFullName ?? 'ce client';
    const stayRange = `du ${this.formatShortDate(reservation.checkInDate)} au ${this.formatShortDate(reservation.checkOutDate)}`;

    switch (this.confirmAction()) {
      case 'confirm':
        return `Confirmer la réservation de ${customer} ${stayRange} ?`;
      case 'complete':
        return `Marquer le séjour de ${customer} ${stayRange} comme terminé ?`;
      case 'noShow':
        return `Marquer ${customer} comme absent ? Cette action est irréversible.`;
      default:
        return 'Confirmez cette action.';
    }
  });

  constructor() {
    this.reloadReservations();
    this.store.loadStatusCounts();

    effect(() => {
      if (!this.pendingRefresh() || this.store.saving()) {
        return;
      }

      this.pendingRefresh.set(false);

      if (this.store.actionError()) {
        return;
      }

      this.reloadReservations();
      this.store.loadStatusCounts();
    });
  }

  protected onSearch(value: string): void {
    this.searchTerm.set(value);
  }

  protected selectFilter(filter: ReservationFilter): void {
    this.selectedFilter.set(filter);
    this.currentPage.set(1);
    this.reloadReservations();
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
    this.reloadReservations();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected openReservation(reservation: HotelReservation): void {
    this.router.navigate(['/hotel/reservations', reservation.id]);
  }

  protected openConfirmAction(
    action: ReservationAction,
    reservation: HotelReservation,
    event?: Event,
  ): void {
    event?.stopPropagation();
    this.confirmAction.set(action);
    this.actionTarget.set(reservation);
    this.showConfirmDialog.set(true);
  }

  protected submitConfirmAction(): void {
    const reservation = this.actionTarget();
    const action = this.confirmAction();

    if (!reservation || !action) {
      return;
    }

    this.showConfirmDialog.set(false);
    this.pendingRefresh.set(true);

    switch (action) {
      case 'confirm':
        this.store.confirmReservation(reservation.id);
        break;
      case 'complete':
        this.store.completeReservation(reservation.id);
        break;
      case 'noShow':
        this.store.markNoShow(reservation.id);
        break;
    }
  }

  protected openCancelDialog(
    reservation: HotelReservation,
    event?: Event,
  ): void {
    event?.stopPropagation();
    this.actionTarget.set(reservation);
    this.cancelReason.set(reservation.cancellationReason ?? '');
    this.showCancelDialog.set(true);
  }

  protected submitCancel(): void {
    const reservation = this.actionTarget();
    const reason = this.cancelReason().trim();

    if (!reservation || !reason) {
      return;
    }

    this.showCancelDialog.set(false);
    this.pendingRefresh.set(true);
    this.store.cancelReservation({ id: reservation.id, reason });
  }

  protected statusLabel(status: HotelReservationStatus): string {
    return STATUS_LABELS[status];
  }

  protected canConfirm(reservation: HotelReservation): boolean {
    return reservation.status === 'PENDING';
  }

  protected canCancel(reservation: HotelReservation): boolean {
    return (
      reservation.status === 'PENDING' || reservation.status === 'CONFIRMED'
    );
  }

  protected canComplete(reservation: HotelReservation): boolean {
    return reservation.status === 'CONFIRMED';
  }

  protected canMarkNoShow(reservation: HotelReservation): boolean {
    return reservation.status === 'CONFIRMED';
  }

  protected isActionLoading(reservationId: string): boolean {
    return this.store.activeActionId() === reservationId && this.store.saving();
  }

  protected retry(): void {
    this.reloadReservations();
    this.store.loadStatusCounts();
  }

  protected formatDateRange(reservation: HotelReservation): string {
    return `${this.formatShortDate(reservation.checkInDate)} - ${this.formatShortDate(reservation.checkOutDate)}`;
  }

  protected formatShortDate(value?: string): string {
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

  protected formatCurrency(amount?: number): string {
    if (typeof amount !== 'number') {
      return '—';
    }

    return `${new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0,
    }).format(amount)} FCFA`;
  }

  protected guestCountLabel(count?: number): string {
    if (typeof count !== 'number' || count <= 0) {
      return '—';
    }

    return `${count} voyageur${count > 1 ? 's' : ''}`;
  }

  private reloadReservations(): void {
    const status = this.selectedFilterValue();

    this.store.setFilterStatus(status ?? null);
    this.store.load?.({
      status,
      pageable: {
        page: this.currentPage() - 1,
        size: PAGE_SIZE,
        sort: ['createdAt,desc'],
      },
    });
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private selectedFilterValue(): HotelReservationStatus | undefined {
    const filter = this.selectedFilter();

    return filter === 'ALL' ? undefined : filter;
  }
}
